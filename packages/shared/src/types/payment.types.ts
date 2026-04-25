export interface Payment {
  id: string;
  debtId: string;
  householdId: string;
  amount: number;
  currency: string;
  paidAt: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}
