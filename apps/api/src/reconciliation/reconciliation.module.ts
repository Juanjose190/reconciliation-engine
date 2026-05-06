import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "../audit/audit-log.entity";
import { ExternalTransaction } from "../fake-blockchain/external-transaction.entity";
import { FakeBlockchainModule } from "../fake-blockchain/fake-blockchain.module";
import { EventsModule } from "../events/events.module";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { Tenant } from "../tenants/tenant.entity";
import { TransactionRequest } from "../transactions/transaction-request.entity";
import { Discrepancy } from "./discrepancy.entity";
import { ReconciliationController } from "./reconciliation.controller";
import { ReconciliationRun } from "./reconciliation-run.entity";
import { ReconciliationService } from "./reconciliation.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TransactionRequest, ExternalTransaction, Discrepancy, ReconciliationRun, AuditLog]),
    FakeBlockchainModule,
    EventsModule,
    NotificationsModule
  ],
  controllers: [ReconciliationController],
  providers: [ReconciliationService, LedgerService, AccountBuilder],
  exports: [ReconciliationService]
})
export class ReconciliationModule {}
