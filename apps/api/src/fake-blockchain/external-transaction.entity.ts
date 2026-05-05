import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ExternalTransactionStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Failed = "FAILED"
}

export enum ExternalTransactionDirection {
  Deposit = "DEPOSIT",
  Withdrawal = "WITHDRAWAL"
}

@Entity("external_transactions")
@Index(["transactionRequestId"], { unique: true, where: "\"transactionRequestId\" IS NOT NULL" })
export class ExternalTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  transactionRequestId: string | null;

  @Column()
  chain: string;

  @Column({ default: "USD" })
  token: string;

  @Column({ type: "enum", enum: ExternalTransactionDirection })
  direction: ExternalTransactionDirection;

  @Column({ type: "enum", enum: ExternalTransactionStatus, default: ExternalTransactionStatus.Pending })
  status: ExternalTransactionStatus;

  @Column({ type: "numeric", precision: 18, scale: 2 })
  requestedAmount: string;

  @Column({ type: "numeric", precision: 18, scale: 2, nullable: true })
  settledAmount: string | null;

  @Column({ nullable: true })
  failureReason: string | null;

  @Column()
  settleAfter: Date;

  @Column({ nullable: true })
  confirmedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
