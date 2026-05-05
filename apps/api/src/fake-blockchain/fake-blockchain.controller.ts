import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { requireTenantId } from "../common/tenant";
import { CreateExternalTransactionDto, ForceSettleDto } from "./dto";
import { FakeBlockchainService } from "./fake-blockchain.service";

@Controller("fake-blockchain/transactions")
export class FakeBlockchainController {
  constructor(private readonly blockchain: FakeBlockchainService) {}

  @Post()
  create(@Headers("x-tenant-id") tenantId: string | undefined, @Body() dto: CreateExternalTransactionDto) {
    return this.blockchain.create(requireTenantId(tenantId), dto);
  }

  @Get(":id")
  findOne(@Headers("x-tenant-id") tenantId: string | undefined, @Param("id") id: string) {
    return this.blockchain.findOne(requireTenantId(tenantId), id);
  }

  @Post(":id/settle")
  forceSettle(
    @Headers("x-tenant-id") tenantId: string | undefined,
    @Param("id") id: string,
    @Body() dto: ForceSettleDto
  ) {
    return this.blockchain.forceSettle(requireTenantId(tenantId), id, dto);
  }
}
