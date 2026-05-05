import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { toMinorUnits } from "../common/money";
import { ExternalTransactionDirection } from "../fake-blockchain/external-transaction.entity";
import { FakeBlockchainService } from "../fake-blockchain/fake-blockchain.service";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { TenantsService } from "../tenants/tenants.service";
import { User } from "../users/user.entity";
import { CreateExternalFlowDto, CreateTransferDto } from "./dto";
import { TransactionRequest, TransactionStatus, TransactionType } from "./transaction-request.entity";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionRequest) private readonly requests: Repository<TransactionRequest>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly tenants: TenantsService,
    private readonly ledger: LedgerService,
    private readonly accounts: AccountBuilder,
    private readonly blockchain: FakeBlockchainService
  ) {}

  async transfer(tenantId: string, dto: CreateTransferDto) {
    await this.assertUser(tenantId, dto.sourceUserId);
    await this.assertUser(tenantId, dto.destinationUserId);
    const tenant = await this.tenants.findOne(tenantId);

    const request = await this.requests.save(
      this.requests.create({
        tenantId,
        sourceUserId: dto.sourceUserId,
        destinationUserId: dto.destinationUserId,
        type: TransactionType.InternalTransfer,
        requestedAmount: dto.amount,
        currency: dto.currency ?? "USD",
        idempotencyKey: dto.idempotencyKey
      })
    );

    const formanceTransactionId = await this.ledger.postTransaction({
      ledgerName: tenant.ledgerName,
      idempotencyKey: dto.idempotencyKey,
      postings: [
        {
          source: this.accounts.userLiability(dto.sourceUserId),
          destination: this.accounts.userLiability(dto.destinationUserId),
          amount: toMinorUnits(dto.amount)
        }
      ],
      metadata: { tenant_id: tenantId, transaction_request_id: request.id, idempotency_key: dto.idempotencyKey }
    });

    request.formanceTransactionId = formanceTransactionId;
    request.status = TransactionStatus.Reconciled;
    return this.requests.save(request);
  }

  async deposit(tenantId: string, dto: CreateExternalFlowDto) {
    await this.assertUser(tenantId, dto.userId);
    const request = await this.requests.save(
      this.requests.create({
        tenantId,
        destinationUserId: dto.userId,
        type: TransactionType.Deposit,
        requestedAmount: dto.amount,
        currency: "USD",
        idempotencyKey: dto.idempotencyKey,
        status: TransactionStatus.PendingExternal,
        metadata: { chain: dto.chain, token: dto.token ?? "USD" }
      })
    );
    const external = await this.blockchain.create(tenantId, {
      transactionRequestId: request.id,
      direction: ExternalTransactionDirection.Deposit,
      chain: dto.chain,
      token: dto.token,
      requestedAmount: dto.amount
    });
    return { request, external };
  }

  async withdrawal(tenantId: string, dto: CreateExternalFlowDto) {
    await this.assertUser(tenantId, dto.userId);
    const tenant = await this.tenants.findOne(tenantId);
    const request = await this.requests.save(
      this.requests.create({
        tenantId,
        sourceUserId: dto.userId,
        type: TransactionType.Withdrawal,
        requestedAmount: dto.amount,
        currency: "USD",
        idempotencyKey: dto.idempotencyKey,
        status: TransactionStatus.Received,
        metadata: { chain: dto.chain, token: dto.token ?? "USD" }
      })
    );

    const formanceTransactionId = await this.ledger.postTransaction({
      ledgerName: tenant.ledgerName,
      idempotencyKey: dto.idempotencyKey,
      postings: [
        {
          source: this.accounts.userLiability(dto.userId),
          destination: this.accounts.assetBlockchain(dto.chain, dto.token ?? "USD"),
          amount: toMinorUnits(dto.amount)
        }
      ],
      metadata: { tenant_id: tenantId, transaction_request_id: request.id, idempotency_key: dto.idempotencyKey }
    });

    request.formanceTransactionId = formanceTransactionId;
    request.status = TransactionStatus.PendingExternal;
    await this.requests.save(request);

    const external = await this.blockchain.create(tenantId, {
      transactionRequestId: request.id,
      direction: ExternalTransactionDirection.Withdrawal,
      chain: dto.chain,
      token: dto.token,
      requestedAmount: dto.amount
    });
    return { request, external };
  }

  async findAll(tenantId: string) {
    return this.requests.find({ where: { tenantId }, order: { createdAt: "DESC" }, take: 100 });
  }

  async findOne(tenantId: string, id: string) {
    const request = await this.requests.findOne({ where: { id, tenantId } });
    if (!request) {
      throw new NotFoundException("Transaction request not found");
    }
    return request;
  }

  private async assertUser(tenantId: string, userId: string) {
    const user = await this.users.findOne({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found for tenant`);
    }
    return user;
  }
}
