import { Transaction } from '../types';

export interface SyncPayload {
  transactions: Transaction[];
  lastSyncedAt: string | null;
}

export interface SyncResponse {
  transactions: Transaction[];
  syncedAt: string;
}
