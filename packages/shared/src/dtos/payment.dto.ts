export interface CreatePaymentDto {
  debtId: string;
  amount: number;
  currency: string;
  paidAt: string;
  note?: string;
}
