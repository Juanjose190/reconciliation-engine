import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { Channel, ChannelModel } from "amqplib";

@Injectable()
export class RabbitAlertPublisher implements OnApplicationShutdown {
  private readonly logger = new Logger(RabbitAlertPublisher.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private connecting?: Promise<Channel | null>;

  constructor(private readonly config: ConfigService) {}

  async publishDiscrepancyAlert(alert: Record<string, unknown>) {
    const channel = await this.getChannel();
    if (!channel) {
      this.logger.debug("RabbitMQ disabled; skipped discrepancy alert");
      return;
    }

    const exchange = this.config.get<string>("RABBITMQ_ALERT_EXCHANGE") ?? "reconciliation.alerts";
    await channel.assertExchange(exchange, "topic", { durable: true });
    channel.publish(exchange, "discrepancy.opened", Buffer.from(JSON.stringify(alert)), {
      contentType: "application/json",
      persistent: true
    });
  }

  async onApplicationShutdown() {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async getChannel() {
    if (this.channel) {
      return this.channel;
    }

    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) {
      return null;
    }

    this.connecting ??= this.connect(url);
    return this.connecting;
  }

  private async connect(url: string) {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      return this.channel;
    } catch (error) {
      this.logger.warn(`RabbitMQ unavailable; continuing without alert queue: ${String(error)}`);
      return null;
    }
  }
}
