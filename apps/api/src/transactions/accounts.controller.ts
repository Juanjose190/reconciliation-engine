import { Controller, Get, Headers, Param } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { requireTenantId } from "../common/tenant";
import { AccountBuilder } from "../ledger/account-builder";
import { LedgerService } from "../ledger/ledger.service";
import { TenantsService } from "../tenants/tenants.service";
import { User } from "../users/user.entity";

@Controller()
export class AccountsController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly accounts: AccountBuilder,
    private readonly tenants: TenantsService,
    private readonly ledger: LedgerService
  ) {}

  @Get("accounts")
  async list(@Headers("x-tenant-id") tenantId: string | undefined) {
    const scopedTenantId = requireTenantId(tenantId);
    const users = await this.users.find({ where: { tenantId: scopedTenantId }, order: { createdAt: "ASC" } });
    return {
      accounts: [
        this.accounts.assetBlockchain("ethereum"),
        this.accounts.revenueFees("platform"),
        this.accounts.expenseFees("network"),
        this.accounts.equityCorrections(),
        ...users.map((user) => this.accounts.userLiability(user.id))
      ]
    };
  }

  @Get("balances/:account")
  async balance(@Headers("x-tenant-id") tenantId: string | undefined, @Param("account") account: string) {
    const tenant = await this.tenants.findOne(requireTenantId(tenantId));
    return this.ledger.getBalance(tenant.ledgerName, this.accounts.validate(account));
  }

  @Get("accounts/:account/transactions")
  async history(@Headers("x-tenant-id") tenantId: string | undefined, @Param("account") account: string) {
    const tenant = await this.tenants.findOne(requireTenantId(tenantId));
    return this.ledger.getAccountTransactions(tenant.ledgerName, this.accounts.validate(account));
  }
}
