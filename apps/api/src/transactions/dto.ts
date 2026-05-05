import { IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  sourceUserId: string;

  @IsString()
  @IsNotEmpty()
  destinationUserId: string;

  @IsNumberString()
  amount: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}

export class CreateExternalFlowDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  chain: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
