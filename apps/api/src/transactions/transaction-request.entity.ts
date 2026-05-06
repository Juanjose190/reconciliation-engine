import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum TransactionType {
  InternalTransfer = "INTERNAL_TRANSFER",
  Deposit = "DEPOSIT",
  Withdrawal = "WITHDRAWAL"
}

export enum TransactionStatus {
  Received = "RECEIVED",
  PostedInternal = "POSTED_INTERNAL",
  PendingExternal = "PENDING_EXTERNAL",
  ConfirmedExternal = "CONFIRMED_EXTERNAL",
  FailedExternal = "FAILED_EXTERNAL",
  Reconciled = "RECONCILED",
  Discrepant = "DISCREPANT",
  Corrected = "CORRECTED"
}

@Entity("transaction_requests")
@Index(["idempotencyKey"], { unique: true })
export class TransactionRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: "uuid", nullable: true })
  sourceUserId: string | null;

  @Column({ type: "uuid", nullable: true })
  destinationUserId: string | null;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({ type: "numeric", precision: 18, scale: 2 })
  requestedAmount: string;

  @Column({ default: "USD" })
  currency: string;

  @Column({ type: "enum", enum: TransactionStatus, default: TransactionStatus.Received })
  status: TransactionStatus;

  @Column({ type: "text", nullable: true })
  formanceTransactionId: string | null;

  @Column()
  idempotencyKey: string;

  @Column({ type: "jsonb", default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
