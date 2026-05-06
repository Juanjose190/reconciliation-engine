import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../audit/audit-log.entity";
import { toMinorUnits } from "../common/money";
import { EventPublisher } from "../events/event-publisher.service";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { Discrepancy, DiscrepancyStatus } from "../reconciliation/discrepancy.entity";
import { Tenant } from "../tenants/tenant.entity";
import { BookCorrectionDto } from "./dto";
import { Correction } from "./correction.entity";

@Injectable()
export class CorrectionsService {
  constructor(
    @InjectRepository(Correction) private readonly corrections: Repository<Correction>,
    @InjectRepository(Discrepancy) private readonly discrepancies: Repository<Discrepancy>,
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly ledger: LedgerService,
    private readonly accounts: AccountBuilder,
    private readonly events: EventPublisher
  ) {}

  async book(tenantId: string, discrepancyId: string, dto: BookCorrectionDto) {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    const discrepancy = await this.discrepancies.findOne({ where: { id: discrepancyId, tenantId } });
    if (!tenant || !discrepancy) {
      throw new NotFoundException("Discrepancy not found");
    }

    discrepancy.status = DiscrepancyStatus.CorrectionPending;
    await this.discrepancies.save(discrepancy);

    const userAccount = this.accounts.userLiability(dto.userId);
    const correctionAccount = this.accounts.equityCorrections();
    const userCredit = dto.direction === "USER_CREDIT";
    const correction = await this.corrections.save(
      this.corrections.create({
        tenantId,
        discrepancyId,
        amount: dto.amount,
        currency: "USD",
        reason: dto.reason,
        createdBy: null
      })
    );

    const formanceTransactionId = await this.ledger.postTransaction({
      ledgerName: tenant.ledgerName,
      idempotencyKey: dto.idempotencyKey,
      postings: [
        {
          source: userCredit ? correctionAccount : userAccount,
          destination: userCredit ? userAccount : correctionAccount,
          amount: toMinorUnits(dto.amount)
        }
      ],
      metadata: {
        tenant_id: tenantId,
        correction_id: correction.id,
        discrepancy_id: discrepancy.id,
        idempotency_key: dto.idempotencyKey
      }
    });

    correction.formanceTransactionId = formanceTransactionId;
    await this.corrections.save(correction);

    discrepancy.status = DiscrepancyStatus.Resolved;
    discrepancy.resolvedAt = new Date();
    await this.discrepancies.save(discrepancy);

    await this.auditLogs.save(
      this.auditLogs.create({
        tenantId,
        entityType: "discrepancy",
        entityId: discrepancy.id,
        action: "CORRECTED",
        message: dto.reason,
        beforeState: null,
        afterState: { correction, discrepancy },
        actorId: null
      })
    );
    await this.events.publish("reconciliation.corrections", {
      type: "correction.booked",
      tenantId,
      entityId: correction.id,
      occurredAt: new Date().toISOString(),
      payload: {
        correctionId: correction.id,
        discrepancyId: discrepancy.id,
        amount: correction.amount,
        formanceTransactionId
      }
    });

    return { correction, discrepancy };
  }
}
