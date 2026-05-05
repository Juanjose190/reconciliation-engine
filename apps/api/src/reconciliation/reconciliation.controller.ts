import { Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { requireTenantId } from "../common/tenant";
import { ReconciliationService } from "./reconciliation.service";

@Controller("reconciliation")
export class ReconciliationController {
  constructor(private readonly reconciliation: ReconciliationService) {}

  @Post("run")
  run(@Headers("x-tenant-id") tenantId: string | undefined) {
    return this.reconciliation.runForTenant(requireTenantId(tenantId));
  }

  @Get("runs")
  runs(@Headers("x-tenant-id") tenantId: string | undefined) {
    return this.reconciliation.listRuns(requireTenantId(tenantId));
  }

  @Get("alerts")
  alerts(@Headers("x-tenant-id") tenantId: string | undefined) {
    return this.reconciliation.listAlerts(requireTenantId(tenantId));
  }

  @Get("alerts/:id")
  alert(@Headers("x-tenant-id") tenantId: string | undefined, @Param("id") id: string) {
    return this.reconciliation.getAlert(requireTenantId(tenantId), id);
  }
}
