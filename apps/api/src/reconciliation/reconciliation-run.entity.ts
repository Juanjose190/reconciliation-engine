import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum ReconciliationRunStatus {
  Running = "RUNNING",
  Completed = "COMPLETED",
  Failed = "FAILED"
}

@Entity("reconciliation_runs")
export class ReconciliationRun {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: "enum", enum: ReconciliationRunStatus, default: ReconciliationRunStatus.Running })
  status: ReconciliationRunStatus;

  @Column({ default: 0 })
  checkedCount: number;

  @Column({ default: 0 })
  discrepancyCount: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  finishedAt: Date | null;
}
