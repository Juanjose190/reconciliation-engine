import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateTenantDto } from "./dto";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Get()
  findAll() {
    return this.tenants.findAll();
  }
}
