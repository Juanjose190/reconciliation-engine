import { IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";

export class BookCorrectionDto {
  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsString()
  @IsOptional()
  direction?: "USER_DEBIT" | "USER_CREDIT";
}
