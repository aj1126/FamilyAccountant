export type DebtDirection = 'owed_to_me' | 'i_owe';

export interface Debt {
  id: string;
  householdId: string;
  creditorId: string;
  debtorId: string;
  amount: number;
  currency: string;
  description: string;
  direction: DebtDirection;
  settled: boolean;
  createdAt: string;
  updatedAt: string;
}
