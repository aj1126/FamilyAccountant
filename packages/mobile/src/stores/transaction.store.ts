import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@family-accountant/shared';
import { db } from '../db/database';
import { apiClient } from '../services/api.client';
import { SyncQueue } from '@family-accountant/shared';

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
    const rows = await db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY transactionDate DESC');
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

    await db.runAsync(
      `INSERT INTO transactions (id, localId, accountId, householdId, amount, currency,
        description, category, transactionDate, syncStatus, createdAt, updatedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id, tx.localId, tx.accountId, tx.householdId, tx.amount, tx.currency,
        tx.description, tx.category, tx.transactionDate, tx.syncStatus,
        tx.createdAt, tx.updatedAt, tx.deletedAt ?? null,
      ],
    );

    set((state) => ({ transactions: [tx, ...state.transactions] }));

    syncQueue.enqueue(() => get().syncWithServer(null));
  },

  syncWithServer: async (lastSyncedAt) => {
    const pending = get().transactions.filter((t) => t.syncStatus === 'pending');
    const { data } = await apiClient.post('/sync', { transactions: pending, lastSyncedAt });

    for (const serverTx of data.transactions as Transaction[]) {
      await db.runAsync(
        `INSERT OR REPLACE INTO transactions
          (id, localId, accountId, householdId, amount, currency, description,
           category, transactionDate, syncStatus, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serverTx.id, serverTx.localId, serverTx.accountId, serverTx.householdId,
          serverTx.amount, serverTx.currency, serverTx.description, serverTx.category,
          serverTx.transactionDate, 'synced', serverTx.createdAt, serverTx.updatedAt,
          serverTx.deletedAt ?? null,
        ],
      );
    }

    const syncedLocalIds = new Set(
      (data.transactions as Transaction[]).map((t) => t.localId),
    );
    for (const localId of syncedLocalIds) {
      await db.runAsync(
        "UPDATE transactions SET syncStatus = 'synced' WHERE localId = ?",
        [localId],
      );
    }

    await get().loadFromDb();
  },
}));
