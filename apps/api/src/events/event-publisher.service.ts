import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Producer } from "kafkajs";

export type DomainEvent = {
  type: string;
  tenantId: string;
  entityId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

@Injectable()
export class EventPublisher implements OnApplicationShutdown {
  private readonly logger = new Logger(EventPublisher.name);
  private producer?: Producer;
  private connecting?: Promise<Producer | null>;

  constructor(private readonly config: ConfigService) {}

  async publish(topic: string, event: DomainEvent) {
    const producer = await this.getProducer();
    if (!producer) {
      this.logger.debug(`Kafka disabled; skipped ${event.type}`);
      return;
    }

    await producer.send({
      topic,
      messages: [
        {
          key: `${event.tenantId}:${event.entityId}`,
          value: JSON.stringify(event),
          headers: {
            event_type: event.type,
            tenant_id: event.tenantId
          }
        }
      ]
    });
  }

  async onApplicationShutdown() {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }

  private async getProducer() {
    if (this.producer) {
      return this.producer;
    }

    const brokers = this.config.get<string>("KAFKA_BROKERS");
    if (!brokers) {
      return null;
    }

    this.connecting ??= this.connect(brokers);
    return this.connecting;
  }

  private async connect(brokers: string) {
    try {
      const kafka = new Kafka({
        clientId: this.config.get<string>("KAFKA_CLIENT_ID") ?? "reconciliation-core",
        brokers: brokers.split(",").map((broker) => broker.trim())
      });
      this.producer = kafka.producer();
      await this.producer.connect();
      return this.producer;
    } catch (error) {
      this.logger.warn(`Kafka unavailable; continuing without event publishing: ${String(error)}`);
      return null;
    }
  }
}
