import { create } from 'zustand';
import { Transaction } from '@family-accountant/shared';
import { SyncQueue } from '@family-accountant/shared';
import { apiClient } from '../services/api.client';

declare global {
  interface Window {
    electronAPI: {
      getTransactions: () => Promise<Transaction[]>;
      addTransaction: (tx: Transaction) => Promise<Transaction>;
      updateSyncStatus: (id: string, status: string) => Promise<void>;
    };
  }
}

const syncQueue = new SyncQueue();

interface TransactionState {
  transactions: Transaction[];
  loadFromDb: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  syncWithServer: (lastSyncedAt: string | null) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  loadFromDb: async () => {
    const rows = await window.electronAPI.getTransactions();
    set({ transactions: rows });
  },

  addTransaction: async (txData) => {
    const now = new Date().toISOString();
    const id = `local-${Date.now()}`;
    const tx: Transaction = {
      ...txData,
      id,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await window.electronAPI.addTransaction(tx);
    set((state) => ({ transactions: [tx, ...state.transactions] }));
    syncQueue.enqueue(() => get().syncWithServer(null));
  },

  syncWithServer: async (lastSyncedAt) => {
    const pending = get().transactions.filter((t) => t.syncStatus === 'pending');
    const { data } = await apiClient.post('/sync', { transactions: pending, lastSyncedAt });

    for (const serverTx of data.transactions as Transaction[]) {
      await window.electronAPI.updateSyncStatus(serverTx.id, 'synced');
    }

    await get().loadFromDb();
  },
}));
