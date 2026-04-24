import { IsString, IsNumber, IsUUID, IsEnum } from 'class-validator';

export enum DebtDirection {
  OwedToMe = 'owed_to_me',
  IOwe = 'i_owe',
}

export class CreateDebtDto {
  @IsUUID()
  creditorId!: string;

  @IsUUID()
  debtorId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  description!: string;

  @IsEnum(DebtDirection)
  direction!: DebtDirection;
}
