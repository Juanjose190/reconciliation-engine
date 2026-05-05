import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("corrections")
export class Correction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column()
  discrepancyId: string;

  @Column({ type: "numeric", precision: 18, scale: 2 })
  amount: string;

  @Column({ default: "USD" })
  currency: string;

  @Column()
  reason: string;

  @Column({ nullable: true })
  formanceTransactionId: string | null;

  @Column({ nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
