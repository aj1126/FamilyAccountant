export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Transaction {
  id: string;
  localId: string;
  accountId?: string;
  householdId: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  transactionDate: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
