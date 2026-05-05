import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { LedgerService } from "../ledger/ledger.service";
import { Tenant } from "./tenant.entity";
import { CreateTenantDto } from "./dto";

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    private readonly ledger: LedgerService
  ) {}

  async create(dto: CreateTenantDto) {
    const tenant = this.tenants.create({
      name: dto.name,
      ledgerName: `company_${randomUUID().replaceAll("-", "")}`
    });
    const saved = await this.tenants.save(tenant);
    await this.ledger.createLedger(saved.ledgerName);
    return saved;
  }

  async findAll() {
    return this.tenants.find({ order: { createdAt: "ASC" } });
  }

  async findOne(id: string) {
    const tenant = await this.tenants.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
    return tenant;
  }
}
