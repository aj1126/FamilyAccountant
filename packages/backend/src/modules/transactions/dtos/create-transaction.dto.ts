import { IsString, IsNumber, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  localId!: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  transactionDate!: string;
}
