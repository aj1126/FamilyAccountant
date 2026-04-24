import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('family_accountant.db');

export async function initDatabase(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      localId TEXT UNIQUE NOT NULL,
      accountId TEXT NOT NULL,
      householdId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      transactionDate TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    );
  `);
}
