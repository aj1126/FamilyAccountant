import { IsString, MinLength, MaxLength, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum AccountType {
  Checking = 'checking',
  Savings = 'savings',
  Credit = 'credit',
  Cash = 'cash',
  Investment = 'investment',
}

export class CreateAccountDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;
}
