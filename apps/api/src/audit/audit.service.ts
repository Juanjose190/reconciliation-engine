import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./audit-log.entity";

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>) {}

  record(input: Omit<AuditLog, "id" | "createdAt">) {
    return this.auditLogs.save(this.auditLogs.create(input));
  }
}
