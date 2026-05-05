import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { Correction } from "../corrections/correction.entity";
import { Discrepancy } from "../reconciliation/discrepancy.entity";
import { ReconciliationRun } from "../reconciliation/reconciliation-run.entity";
import { TransactionRequest } from "../transactions/transaction-request.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(TransactionRequest) private readonly requests: Repository<TransactionRequest>,
    @InjectRepository(Discrepancy) private readonly discrepancies: Repository<Discrepancy>,
    @InjectRepository(Correction) private readonly corrections: Repository<Correction>,
    @InjectRepository(ReconciliationRun) private readonly runs: Repository<ReconciliationRun>
  ) {}

  async reconciliation(tenantId: string, from: string, to: string, format: "json" | "csv" = "json") {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const [transactions, discrepancies, corrections, runs] = await Promise.all([
      this.requests.find({ where: { tenantId, createdAt: Between(fromDate, toDate) }, order: { createdAt: "ASC" } }),
      this.discrepancies.find({ where: { tenantId, detectedAt: Between(fromDate, toDate) }, order: { detectedAt: "ASC" } }),
      this.corrections.find({ where: { tenantId, createdAt: Between(fromDate, toDate) }, order: { createdAt: "ASC" } }),
      this.runs.find({ where: { tenantId, startedAt: Between(fromDate, toDate) }, order: { startedAt: "ASC" } })
    ]);

    const report = {
      tenantId,
      period: { from, to },
      totals: {
        transactions: transactions.length,
        discrepancies: discrepancies.length,
        corrections: corrections.length,
        reconciliationRuns: runs.length
      },
      transactions,
      discrepancies,
      corrections,
      runs
    };

    if (format === "csv") {
      return this.toCsv(report);
    }
    return report;
  }

  private toCsv(report: any) {
    const rows = ["section,id,status,type,amount,created_at"];
    for (const tx of report.transactions) {
      rows.push(`transaction,${tx.id},${tx.status},${tx.type},${tx.requestedAmount},${tx.createdAt.toISOString()}`);
    }
    for (const discrepancy of report.discrepancies) {
      rows.push(
        `discrepancy,${discrepancy.id},${discrepancy.status},${discrepancy.type},${discrepancy.deltaAmount},${discrepancy.detectedAt.toISOString()}`
      );
    }
    for (const correction of report.corrections) {
      rows.push(`correction,${correction.id},POSTED,CORRECTION,${correction.amount},${correction.createdAt.toISOString()}`);
    }
    return rows.join("\n");
  }
}
