import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  action: string;

  @Column()
  message: string;

  @Column({ type: "jsonb", nullable: true })
  beforeState: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true })
  afterState: Record<string, unknown> | null;

  @Column({ nullable: true })
  actorId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
