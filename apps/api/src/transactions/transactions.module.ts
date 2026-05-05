import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FakeBlockchainModule } from "../fake-blockchain/fake-blockchain.module";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { TenantsModule } from "../tenants/tenants.module";
import { User } from "../users/user.entity";
import { AccountsController } from "./accounts.controller";
import { TransactionRequest } from "./transaction-request.entity";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";

@Module({
  imports: [TypeOrmModule.forFeature([TransactionRequest, User]), TenantsModule, FakeBlockchainModule],
  controllers: [TransactionsController, AccountsController],
  providers: [TransactionsService, LedgerService, AccountBuilder],
  exports: [TransactionsService]
})
export class TransactionsModule {}
