import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LedgerService } from "../ledger/ledger.service";
import { Tenant } from "./tenant.entity";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  providers: [TenantsService, LedgerService],
  exports: [TenantsService]
})
export class TenantsModule {}
