import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../audit/audit-log.entity";
import { fromMinorUnits, toMinorUnits } from "../common/money";
import { ExternalTransaction, ExternalTransactionDirection, ExternalTransactionStatus } from "../fake-blockchain/external-transaction.entity";
import { FakeBlockchainService } from "../fake-blockchain/fake-blockchain.service";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { Tenant } from "../tenants/tenant.entity";
import { TransactionRequest, TransactionStatus, TransactionType } from "../transactions/transaction-request.entity";
import { Discrepancy, DiscrepancyStatus, DiscrepancyType } from "./discrepancy.entity";
import { ReconciliationRun, ReconciliationRunStatus } from "./reconciliation-run.entity";

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    @InjectRepository(TransactionRequest) private readonly requests: Repository<TransactionRequest>,
    @InjectRepository(ExternalTransaction) private readonly externals: Repository<ExternalTransaction>,
    @InjectRepository(Discrepancy) private readonly discrepancies: Repository<Discrepancy>,
    @InjectRepository(ReconciliationRun) private readonly runs: Repository<ReconciliationRun>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly blockchain: FakeBlockchainService,
    private readonly ledger: LedgerService,
    private readonly accounts: AccountBuilder
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async scheduledRun() {
    const tenants = await this.tenants.find();
    for (const tenant of tenants) {
      try {
        await this.runForTenant(tenant.id);
      } catch (error) {
        this.logger.warn(`Scheduled reconciliation failed for ${tenant.id}: ${String(error)}`);
      }
    }
  }

  async runForTenant(tenantId: string) {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const run = await this.runs.save(this.runs.create({ tenantId, status: ReconciliationRunStatus.Running }));
    let discrepancyCount = 0;
    const externals = await this.blockchain.findOpen(tenantId);

    for (const external of externals) {
      const request = external.transactionRequestId
        ? await this.requests.findOne({ where: { id: external.transactionRequestId, tenantId } })
        : null;
      if (!request) {
        continue;
      }

      const before = this.snapshot(request);
      if (external.status === ExternalTransactionStatus.Confirmed) {
        discrepancyCount += await this.handleConfirmed(tenant, run, request, external);
      }
      if (external.status === ExternalTransactionStatus.Failed) {
        discrepancyCount += await this.openDiscrepancy(request, external, DiscrepancyType.OrphanedInternal, request.requestedAmount, "0.00");
        request.status = TransactionStatus.Discrepant;
      }
      if (external.status === ExternalTransactionStatus.Pending && external.settleAfter < new Date()) {
        discrepancyCount += await this.openDiscrepancy(
          request,
          external,
          DiscrepancyType.StalePending,
          request.requestedAmount,
          "0.00"
        );
        request.status = TransactionStatus.Discrepant;
      }

      await this.requests.save(request);
      await this.auditLogs.save(
        this.auditLogs.create({
          tenantId,
          entityType: "transaction_request",
          entityId: request.id,
          action: "RECONCILED",
          message: `Reconciliation run ${run.id} checked external transaction ${external.id}`,
          beforeState: before,
          afterState: this.snapshot(request),
          actorId: null
        })
      );
    }

    run.checkedCount = externals.length;
    run.discrepancyCount = discrepancyCount;
    run.status = ReconciliationRunStatus.Completed;
    run.finishedAt = new Date();
    return this.runs.save(run);
  }

  async listRuns(tenantId: string) {
    return this.runs.find({ where: { tenantId }, order: { startedAt: "DESC" }, take: 50 });
  }

  async listAlerts(tenantId: string) {
    return this.discrepancies.find({
      where: [{ tenantId, status: DiscrepancyStatus.Open }, { tenantId, status: DiscrepancyStatus.Acknowledged }],
      order: { detectedAt: "DESC" }
    });
  }

  async getAlert(tenantId: string, id: string) {
    const discrepancy = await this.discrepancies.findOne({ where: { id, tenantId } });
    if (!discrepancy) {
      throw new NotFoundException("Discrepancy not found");
    }
    const audit = await this.auditLogs.find({ where: { tenantId, entityId: id }, order: { createdAt: "ASC" } });
    return { discrepancy, audit };
  }

  private async handleConfirmed(
    tenant: Tenant,
    run: ReconciliationRun,
    request: TransactionRequest,
    external: ExternalTransaction
  ) {
    const settledAmount = external.settledAmount ?? external.requestedAmount;
    let opened = 0;

    if (request.type === TransactionType.Deposit && !request.formanceTransactionId) {
      request.formanceTransactionId = await this.ledger.postTransaction({
        ledgerName: tenant.ledgerName,
        idempotencyKey: `mirror:${external.id}`,
        postings: [
          {
            source: this.accounts.assetBlockchain(external.chain, external.token),
            destination: this.accounts.userLiability(request.destinationUserId ?? ""),
            amount: toMinorUnits(settledAmount)
          }
        ],
        metadata: {
          tenant_id: tenant.id,
          transaction_request_id: request.id,
          external_tx_id: external.id,
          reconciliation_run_id: run.id,
          idempotency_key: `mirror:${external.id}`
        }
      });
    }

    if (toMinorUnits(request.requestedAmount) !== toMinorUnits(settledAmount)) {
      opened += await this.openDiscrepancy(request, external, DiscrepancyType.AmountMismatch, request.requestedAmount, settledAmount);
      request.status = TransactionStatus.Discrepant;
    } else {
      request.status = TransactionStatus.Reconciled;
    }

    return opened;
  }

  private async openDiscrepancy(
    request: TransactionRequest,
    external: ExternalTransaction,
    type: DiscrepancyType,
    expectedAmount: string,
    actualAmount: string
  ) {
    const existing = await this.discrepancies.findOne({
      where: { transactionRequestId: request.id, type, status: DiscrepancyStatus.Open }
    });
    if (existing) {
      return 0;
    }

    const delta = toMinorUnits(expectedAmount) - toMinorUnits(actualAmount);
    const discrepancy = await this.discrepancies.save(
      this.discrepancies.create({
        tenantId: request.tenantId,
        transactionRequestId: request.id,
        externalTransactionId: external.id,
        type,
        status: DiscrepancyStatus.Open,
        expectedAmount,
        actualAmount,
        deltaAmount: fromMinorUnits(delta < 0n ? -delta : delta),
        description: `${type}: expected ${expectedAmount}, actual ${actualAmount}`
      })
    );

    await this.auditLogs.save(
      this.auditLogs.create({
        tenantId: request.tenantId,
        entityType: "discrepancy",
        entityId: discrepancy.id,
        action: "OPENED",
        message: discrepancy.description,
        beforeState: null,
        afterState: this.snapshot(discrepancy),
        actorId: null
      })
    );
    return 1;
  }

  private snapshot(value: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }
}
