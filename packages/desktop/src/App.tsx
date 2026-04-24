import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Debts } from './pages/Debts';

type Page = 'dashboard' | 'transactions' | 'debts';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const navStyle = (p: Page): React.CSSProperties => ({
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: page === p ? 700 : 400,
    borderBottom: page === p ? '2px solid #2563eb' : '2px solid transparent',
    color: page === p ? '#2563eb' : '#64748b',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#fff',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, marginRight: 24 }}>FamilyAccountant</span>
        <button style={navStyle('dashboard')} onClick={() => setPage('dashboard')}>
          Dashboard
        </button>
        <button style={navStyle('transactions')} onClick={() => setPage('transactions')}>
          Transactions
        </button>
        <button style={navStyle('debts')} onClick={() => setPage('debts')}>
          Debts
        </button>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'transactions' && <Transactions />}
        {page === 'debts' && <Debts />}
      </main>
    </div>
  );
}
