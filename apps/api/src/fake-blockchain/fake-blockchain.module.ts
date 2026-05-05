import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExternalTransaction } from "./external-transaction.entity";
import { FakeBlockchainController } from "./fake-blockchain.controller";
import { FakeBlockchainService } from "./fake-blockchain.service";

@Module({
  imports: [TypeOrmModule.forFeature([ExternalTransaction])],
  controllers: [FakeBlockchainController],
  providers: [FakeBlockchainService],
  exports: [FakeBlockchainService]
})
export class FakeBlockchainModule {}
