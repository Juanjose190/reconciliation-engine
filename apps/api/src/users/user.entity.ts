import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "../tenants/tenant.entity";

@Entity("users")
@Index(["tenantId", "externalRef"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @Column()
  externalRef: string;

  @Column()
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;
}
