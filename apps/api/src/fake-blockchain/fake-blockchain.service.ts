import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateExternalTransactionDto, ForceSettleDto } from "./dto";
import { ExternalTransaction, ExternalTransactionStatus } from "./external-transaction.entity";

@Injectable()
export class FakeBlockchainService {
  constructor(
    @InjectRepository(ExternalTransaction) private readonly externalTransactions: Repository<ExternalTransaction>,
    private readonly config: ConfigService
  ) {}

  async create(tenantId: string, dto: CreateExternalTransactionDto) {
    const delaySeconds = Number(this.config.get("FAKE_CHAIN_SETTLEMENT_SECONDS") ?? 30);
    const settleAfter = new Date(Date.now() + delaySeconds * 1000);

    return this.externalTransactions.save(
      this.externalTransactions.create({
        tenantId,
        transactionRequestId: dto.transactionRequestId ?? null,
        direction: dto.direction,
        chain: dto.chain,
        token: dto.token ?? "USD",
        requestedAmount: dto.requestedAmount,
        settleAfter
      })
    );
  }

  async findOne(tenantId: string, id: string) {
    const tx = await this.externalTransactions.findOne({ where: { id, tenantId } });
    if (!tx) {
      throw new NotFoundException("External transaction not found");
    }
    return this.maybeSettle(tx);
  }

  async findOpen(tenantId: string) {
    const txs = await this.externalTransactions.find({ where: { tenantId }, order: { createdAt: "DESC" }, take: 100 });
    const settled = [];
    for (const tx of txs) {
      settled.push(await this.maybeSettle(tx));
    }
    return settled;
  }

  async forceSettle(tenantId: string, id: string, dto: ForceSettleDto) {
    const tx = await this.externalTransactions.findOne({ where: { id, tenantId } });
    if (!tx) {
      throw new NotFoundException("External transaction not found");
    }

    tx.status = dto.status;
    tx.settledAmount = dto.status === ExternalTransactionStatus.Confirmed ? (dto.settledAmount ?? tx.requestedAmount) : null;
    tx.failureReason = dto.status === ExternalTransactionStatus.Failed ? (dto.failureReason ?? "Forced failure") : null;
    tx.confirmedAt = dto.status === ExternalTransactionStatus.Confirmed ? new Date() : null;
    return this.externalTransactions.save(tx);
  }

  private async maybeSettle(tx: ExternalTransaction) {
    if (tx.status !== ExternalTransactionStatus.Pending || tx.settleAfter > new Date()) {
      return tx;
    }

    const failureRate = Number(this.config.get("FAKE_CHAIN_FAILURE_RATE") ?? 0.1);
    const driftRate = Number(this.config.get("FAKE_CHAIN_DRIFT_RATE") ?? 0.2);

    if (Math.random() < failureRate) {
      tx.status = ExternalTransactionStatus.Failed;
      tx.failureReason = "Simulated settlement failure";
      tx.settledAmount = null;
      return this.externalTransactions.save(tx);
    }

    tx.status = ExternalTransactionStatus.Confirmed;
    tx.confirmedAt = new Date();
    tx.settledAmount = this.applyDrift(tx.requestedAmount, driftRate);
    return this.externalTransactions.save(tx);
  }

  private applyDrift(amount: string, driftRate: number) {
    if (Math.random() > driftRate) {
      return amount;
    }
    const cents = Math.round(Number(amount) * 100);
    const delta = Math.max(1, Math.round(cents * 0.005));
    return ((cents - delta) / 100).toFixed(2);
  }
}
