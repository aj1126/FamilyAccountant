import { IsNumber, IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  debtId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsDateString()
  paidAt!: string;

  @IsString()
  @IsOptional()
  note?: string;
}
