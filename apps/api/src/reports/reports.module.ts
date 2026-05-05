import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Correction } from "../corrections/correction.entity";
import { Discrepancy } from "../reconciliation/discrepancy.entity";
import { ReconciliationRun } from "../reconciliation/reconciliation-run.entity";
import { TransactionRequest } from "../transactions/transaction-request.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [TypeOrmModule.forFeature([TransactionRequest, Discrepancy, Correction, ReconciliationRun])],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
