import React, { useState, useEffect } from 'react';
import { useTransactionStore } from '../stores/transaction.store';
import { useAuthStore } from '../stores/auth.store';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import Papa from 'papaparse';
import { Transaction } from '@family-accountant/shared';

export function Transactions() {
  const { transactions, loadFromDb, addTransaction } = useTransactionStore();
  const householdId = useAuthStore((s) => s.householdId);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const filtered = transactions.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async () => {
    const parsed = parseFloat(amount);
    if (!description || isNaN(parsed) || !householdId) return;
    await addTransaction({
      localId: `local-${Date.now()}`,
      accountId: undefined,
      householdId,
      amount: parsed,
      currency: 'USD',
      description,
      category,
      transactionDate: new Date().toISOString().split('T')[0],
      deletedAt: null,
    });
    setDescription('');
    setAmount('');
    setCategory('');
  };

  const handleExport = () => {
    const csv = Papa.unparse(transactions as unknown as Record<string, unknown>[]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Transactions</h1>
        <button
          onClick={handleExport}
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Add Transaction</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            style={inputStyle}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            style={{ ...inputStyle, width: 120 }}
            placeholder="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            style={{ ...inputStyle, width: 140 }}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button
            onClick={handleAdd}
            style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Add
          </button>
        </div>
      </div>

      <input
        style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
        placeholder="Search transactions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Date', 'Description', 'Category', 'Amount', 'Sync'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx: Transaction) => (
              <tr key={tx.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{tx.transactionDate}</td>
                <td style={tdStyle}>{tx.description}</td>
                <td style={tdStyle}>{tx.category}</td>
                <td style={tdStyle}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(Number(tx.amount))}
                </td>
                <td style={tdStyle}>
                  <SyncStatusBadge status={tx.syncStatus} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '32px 16px' }}>
                  No transactions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  flex: 1,
  minWidth: 160,
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: '#64748b',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
};
