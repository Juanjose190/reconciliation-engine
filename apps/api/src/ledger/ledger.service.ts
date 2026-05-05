import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type LedgerPosting = {
  source: string;
  destination: string;
  amount: bigint;
};

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("FORMANCE_BASE_URL") ?? "http://localhost:3068";
  }

  async createLedger(ledgerName: string) {
    try {
      await this.request(`/v2/ledgers/${ledgerName}`, {
        method: "PUT"
      });
    } catch (error) {
      this.logger.warn(`Could not proactively create ledger ${ledgerName}: ${String(error)}`);
    }
  }

  async postTransaction(params: {
    ledgerName: string;
    postings: LedgerPosting[];
    metadata: Record<string, string>;
    idempotencyKey: string;
  }): Promise<string> {
    const body = {
      postings: params.postings.map((posting) => ({
        source: posting.source,
        destination: posting.destination,
        amount: posting.amount.toString(),
        asset: "USD/2"
      })),
      metadata: params.metadata
    };

    const response = await this.request(`/v2/ledgers/${params.ledgerName}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey
      },
      body: JSON.stringify(body)
    });

    return String(response?.data?.id ?? response?.id ?? params.idempotencyKey);
  }

  async getBalance(ledgerName: string, account: string) {
    return this.request(`/v2/ledgers/${ledgerName}/accounts/${encodeURIComponent(account)}/balances`);
  }

  async getAccountTransactions(ledgerName: string, account: string) {
    return this.request(`/v2/ledgers/${ledgerName}/accounts/${encodeURIComponent(account)}/transactions`);
  }

  async getTransactions(ledgerName: string) {
    return this.request(`/v2/ledgers/${ledgerName}/transactions`);
  }

  private async request(path: string, init?: RequestInit): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Formance request failed ${response.status}: ${text}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }
}
