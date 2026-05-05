import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import { requireTenantId } from "../common/tenant";
import { CorrectionsService } from "./corrections.service";
import { BookCorrectionDto } from "./dto";

@Controller("reconciliation/alerts/:id/corrections")
export class CorrectionsController {
  constructor(private readonly corrections: CorrectionsService) {}

  @Post()
  book(@Headers("x-tenant-id") tenantId: string | undefined, @Param("id") id: string, @Body() dto: BookCorrectionDto) {
    return this.corrections.book(requireTenantId(tenantId), id, dto);
  }
}
