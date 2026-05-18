import { Module } from "@nestjs/common";
import { RabbitAlertPublisher } from "./rabbit-alert-publisher.service";

@Module({
  providers: [RabbitAlertPublisher],
  exports: [RabbitAlertPublisher]
})
export class AlertsModule {}
