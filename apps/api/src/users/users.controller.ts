import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { requireTenantId } from "../common/tenant";
import { CreateUserDto } from "./dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Headers("x-tenant-id") tenantId: string | undefined, @Body() dto: CreateUserDto) {
    return this.users.create(requireTenantId(tenantId), dto);
  }

  @Get()
  findAll(@Headers("x-tenant-id") tenantId: string | undefined) {
    return this.users.findAll(requireTenantId(tenantId));
  }
}
