import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@family-accountant/shared';
import { SyncQueue } from '@family-accountant/shared';
import { apiClient } from '../services/api.client';

declare global {
  interface Window {
    electronAPI: {
      getTransactions: () => Promise<Transaction[]>;
      addTransaction: (tx: Transaction) => Promise<Transaction>;
      updateSyncStatus: (id: string, status: string) => Promise<void>;
      openHelp: () => Promise<void>;
    };
  }
}

const syncQueue = new SyncQueue();

interface TransactionState {
  transactions: Transaction[];
  loadFromDb: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  syncWithServer: (forcedLastSyncedAt?: string | null) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  loadFromDb: async () => {
    const rows = await window.electronAPI.getTransactions();
    set({ transactions: rows });
  },

  addTransaction: async (txData) => {
    const now = new Date().toISOString();
    const id = uuidv4();
    const tx: Transaction = {
      ...txData,
      id,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await window.electronAPI.addTransaction(tx);
    set((state) => ({ transactions: [tx, ...state.transactions] }));
    syncQueue.enqueue(() => get().syncWithServer());
  },

  syncWithServer: async (forcedLastSyncedAt) => {
    const lastSyncedAt = forcedLastSyncedAt !== undefined 
      ? forcedLastSyncedAt 
      : localStorage.getItem('lastSyncedAt');

    const pending = get().transactions.filter((t) => t.syncStatus === 'pending');
    
    try {
      const { data } = await apiClient.post('/sync', { transactions: pending, lastSyncedAt });

      for (const serverTx of data.transactions as Transaction[]) {
        await window.electronAPI.addTransaction({
          ...serverTx,
          syncStatus: 'synced',
        });
      }

      const syncedLocalIds = new Set(
        (data.transactions as Transaction[]).map((t) => t.localId),
      );
      for (const localId of syncedLocalIds) {
        await window.electronAPI.updateSyncStatus(localId, 'synced');
      }

      const newSyncTime = new Date().toISOString();
      localStorage.setItem('lastSyncedAt', newSyncTime);

      await get().loadFromDb();
    } catch (err) {
      for (const tx of pending) {
        await window.electronAPI.updateSyncStatus(tx.localId, 'error');
      }
      await get().loadFromDb();
      throw err;
    }
  },
}));
