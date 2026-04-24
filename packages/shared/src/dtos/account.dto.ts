import { AccountType } from '../types';

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  currency: string;
  balance?: number;
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {}
