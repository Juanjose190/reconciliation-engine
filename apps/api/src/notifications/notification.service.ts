import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly config: ConfigService) {}

  async discrepancyOpened(input: {
    tenantId: string;
    discrepancyId: string;
    type: string;
    description: string;
    deltaAmount: string;
  }) {
    const apiKey = this.config.get<string>("NOVU_API_KEY");
    const workflowId = this.config.get<string>("NOVU_DISCREPANCY_WORKFLOW_ID");
    if (!apiKey || !workflowId) {
      this.logger.debug(`Novu disabled; skipped discrepancy notification ${input.discrepancyId}`);
      return;
    }

    const apiUrl = this.config.get<string>("NOVU_API_URL") ?? "https://api.novu.co/v1";
    const response = await fetch(`${apiUrl}/events/trigger`, {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: workflowId,
        to: {
          subscriberId: `tenant:${input.tenantId}`
        },
        payload: input
      })
    });

    if (!response.ok) {
      this.logger.warn(`Novu notification failed ${response.status}: ${await response.text()}`);
    }
  }
}
