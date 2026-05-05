import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export enum DiscrepancyType {
  OrphanedInternal = "ORPHANED_INTERNAL",
  AmountMismatch = "AMOUNT_MISMATCH",
  MissingLedgerPosting = "MISSING_LEDGER_POSTING",
  StalePending = "STALE_PENDING"
}

export enum DiscrepancyStatus {
  Open = "OPEN",
  Acknowledged = "ACKNOWLEDGED",
  CorrectionPending = "CORRECTION_PENDING",
  Resolved = "RESOLVED"
}

@Entity("discrepancies")
@Index(["transactionRequestId", "type", "status"])
export class Discrepancy {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column()
  transactionRequestId: string;

  @Column({ nullable: true })
  externalTransactionId: string | null;

  @Column({ type: "enum", enum: DiscrepancyType })
  type: DiscrepancyType;

  @Column({ type: "enum", enum: DiscrepancyStatus, default: DiscrepancyStatus.Open })
  status: DiscrepancyStatus;

  @Column({ type: "numeric", precision: 18, scale: 2 })
  expectedAmount: string;

  @Column({ type: "numeric", precision: 18, scale: 2, nullable: true })
  actualAmount: string | null;

  @Column({ type: "numeric", precision: 18, scale: 2 })
  deltaAmount: string;

  @Column()
  description: string;

  @CreateDateColumn()
  detectedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date | null;
}
