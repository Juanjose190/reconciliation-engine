import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { requireTenantId } from "../common/tenant";
import { CreateExternalFlowDto, CreateTransferDto } from "./dto";
import { TransactionsService } from "./transactions.service";

@Controller()
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post("transactions")
  transfer(@Headers("x-tenant-id") tenantId: string | undefined, @Body() dto: CreateTransferDto) {
    return this.transactions.transfer(requireTenantId(tenantId), dto);
  }

  @Get("transactions")
  findAll(@Headers("x-tenant-id") tenantId: string | undefined) {
    return this.transactions.findAll(requireTenantId(tenantId));
  }

  @Get("transactions/:id")
  findOne(@Headers("x-tenant-id") tenantId: string | undefined, @Param("id") id: string) {
    return this.transactions.findOne(requireTenantId(tenantId), id);
  }

  @Post("deposits")
  deposit(@Headers("x-tenant-id") tenantId: string | undefined, @Body() dto: CreateExternalFlowDto) {
    return this.transactions.deposit(requireTenantId(tenantId), dto);
  }

  @Post("withdrawals")
  withdrawal(@Headers("x-tenant-id") tenantId: string | undefined, @Body() dto: CreateExternalFlowDto) {
    return this.transactions.withdrawal(requireTenantId(tenantId), dto);
  }
}
