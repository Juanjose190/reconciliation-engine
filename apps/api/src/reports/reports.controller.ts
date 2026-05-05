import { Controller, Get, Headers, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { requireTenantId } from "../common/tenant";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("reconciliation")
  async reconciliation(
    @Headers("x-tenant-id") tenantId: string | undefined,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("format") format: "json" | "csv" | undefined,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.reports.reconciliation(requireTenantId(tenantId), from, to, format ?? "json");
    if (format === "csv") {
      response.type("text/csv");
    }
    return result;
  }
}
