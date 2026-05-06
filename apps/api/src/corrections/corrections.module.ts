import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "../audit/audit-log.entity";
import { EventsModule } from "../events/events.module";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { Discrepancy } from "../reconciliation/discrepancy.entity";
import { Tenant } from "../tenants/tenant.entity";
import { Correction } from "./correction.entity";
import { CorrectionsController } from "./corrections.controller";
import { CorrectionsService } from "./corrections.service";

@Module({
  imports: [TypeOrmModule.forFeature([Correction, Discrepancy, Tenant, AuditLog]), EventsModule],
  controllers: [CorrectionsController],
  providers: [CorrectionsService, LedgerService, AccountBuilder]
})
export class CorrectionsModule {}
