import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";
import { ExternalTransactionDirection, ExternalTransactionStatus } from "./external-transaction.entity";

export class CreateExternalTransactionDto {
  @IsString()
  @IsOptional()
  transactionRequestId?: string;

  @IsEnum(ExternalTransactionDirection)
  direction: ExternalTransactionDirection;

  @IsString()
  @IsNotEmpty()
  chain: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumberString()
  requestedAmount: string;
}

export class ForceSettleDto {
  @IsEnum(ExternalTransactionStatus)
  status: ExternalTransactionStatus.Confirmed | ExternalTransactionStatus.Failed;

  @IsNumberString()
  @IsOptional()
  settledAmount?: string;

  @IsString()
  @IsOptional()
  failureReason?: string;
}
