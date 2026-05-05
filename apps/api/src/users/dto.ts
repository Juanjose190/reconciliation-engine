import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  externalRef: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;
}
