import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccountBuilder } from "../ledger/account-builder";
import { User } from "./user.entity";
import { CreateUserDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly accounts: AccountBuilder
  ) {}

  async create(tenantId: string, dto: CreateUserDto) {
    const user = await this.users.save(this.users.create({ tenantId, ...dto }));
    return { ...user, account: this.accounts.userLiability(user.id) };
  }

  async findAll(tenantId: string) {
    const users = await this.users.find({ where: { tenantId }, order: { createdAt: "ASC" } });
    return users.map((user) => ({ ...user, account: this.accounts.userLiability(user.id) }));
  }
}
