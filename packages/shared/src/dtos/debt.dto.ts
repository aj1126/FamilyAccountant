import { DebtDirection } from '../types';

export interface CreateDebtDto {
  creditorId: string;
  debtorId: string;
  amount: number;
  currency: string;
  description: string;
  direction: DebtDirection;
}

export interface UpdateDebtDto extends Partial<CreateDebtDto> {
  settled?: boolean;
}
