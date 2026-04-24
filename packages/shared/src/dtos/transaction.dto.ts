export interface CreateTransactionDto {
  localId: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  transactionDate: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}
