import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountBuilder } from "./ledger/account-builder";
import { LedgerService } from "./ledger/ledger.service";
import { Tenant } from "./tenants/tenant.entity";
import { User } from "./users/user.entity";
import { TransactionRequest } from "./transactions/transaction-request.entity";
import { ExternalTransaction } from "./fake-blockchain/external-transaction.entity";
import { ReconciliationRun } from "./reconciliation/reconciliation-run.entity";
import { Discrepancy } from "./reconciliation/discrepancy.entity";
import { Correction } from "./corrections/correction.entity";
import { AuditLog } from "./audit/audit-log.entity";
import { TenantsModule } from "./tenants/tenants.module";
import { UsersModule } from "./users/users.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { FakeBlockchainModule } from "./fake-blockchain/fake-blockchain.module";
import { ReconciliationModule } from "./reconciliation/reconciliation.module";
import { CorrectionsModule } from "./corrections/corrections.module";
import { ReportsModule } from "./reports/reports.module";
import { HealthController } from "./health.controller";
import { SeedService } from "./seed.service";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.get<string>("DATABASE_URL") ?? "postgres://formance:formance@localhost:55432/reconciliation",
        entities: [Tenant, User, TransactionRequest, ExternalTransaction, ReconciliationRun, Discrepancy, Correction, AuditLog],
        synchronize: true
      })
    }),
    TypeOrmModule.forFeature([Tenant, User]),
    AuthModule,
    TenantsModule,
    UsersModule,
    TransactionsModule,
    FakeBlockchainModule,
    ReconciliationModule,
    CorrectionsModule,
    ReportsModule
  ],
  controllers: [HealthController],
  providers: [AccountBuilder, LedgerService, SeedService]
})
export class AppModule {}
