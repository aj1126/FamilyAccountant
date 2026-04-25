import React from 'react';
import { useTransactionStore } from '../stores/transaction.store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function getMonthlyData(transactions: { transactionDate: string; amount: number }[]) {
  const map: Record<string, number> = {};
  for (const tx of transactions) {
    const month = tx.transactionDate.slice(0, 7);
    map[month] = (map[month] ?? 0) + Number(tx.amount);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));
}

export function Dashboard() {
  const transactions = useTransactionStore((s) => s.transactions);
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyData = getMonthlyData(transactions);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>Total Spent</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
          </div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>Transactions</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{transactions.length}</div>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Monthly Spending</h2>
        {monthlyData.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
            No data yet — add some transactions
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
