import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LedgerService } from "./ledger/ledger.service";
import { Tenant } from "./tenants/tenant.entity";
import { User } from "./users/user.entity";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly ledger: LedgerService
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get("SEED_DEMO") !== "true") {
      return;
    }

    const existing = await this.tenants.findOne({ where: { name: "Demo Company" } });
    if (existing) {
      return;
    }

    const tenant = await this.tenants.save(
      this.tenants.create({
        name: "Demo Company",
        ledgerName: "company_demo"
      })
    );
    await this.ledger.createLedger(tenant.ledgerName);

    await this.users.save([
      this.users.create({ tenantId: tenant.id, externalRef: "alice", displayName: "Alice Rivera" }),
      this.users.create({ tenantId: tenant.id, externalRef: "bruno", displayName: "Bruno Vega" })
    ]);

    this.logger.log(`Seeded demo tenant ${tenant.id}`);
  }
}
