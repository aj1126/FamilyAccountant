import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Debts } from './pages/Debts';
import { Accounts } from './pages/Accounts';
import { Login } from './pages/Login';
import { HouseholdOnboarding } from './pages/HouseholdOnboarding';
import { useAuthStore } from './stores/auth.store';

// Load tokens synchronously from localStorage before any component renders
// so the app never shows a blank frame waiting for a useEffect to fire.
useAuthStore.getState().loadTokens();

type Page = 'dashboard' | 'transactions' | 'debts' | 'accounts';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const accessToken = useAuthStore((s) => s.accessToken);
  const householdId = useAuthStore((s) => s.householdId);
  const logout = useAuthStore((s) => s.logout);

  if (!accessToken) {
    return <Login />;
  }

  if (!householdId) {
    return <HouseholdOnboarding />;
  }

  const navStyle = (p: Page): React.CSSProperties => ({
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: page === p ? 700 : 400,
    color: page === p ? '#2563eb' : '#64748b',
    background: 'transparent',
    border: 'none',
    borderBottom: page === p ? '2px solid #2563eb' : '2px solid transparent',
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
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, marginRight: 24 }}>FamilyAccountant</span>
        <button style={navStyle('dashboard')} onClick={() => setPage('dashboard')} aria-label="Dashboard">
          Dashboard
        </button>
        <button style={navStyle('transactions')} onClick={() => setPage('transactions')} aria-label="Transactions">
          Transactions
        </button>
        <button style={navStyle('accounts')} onClick={() => setPage('accounts')} aria-label="Accounts">
          Accounts
        </button>
        <button style={navStyle('debts')} onClick={() => setPage('debts')} aria-label="Debts">
          Debts
        </button>
        <button
          onClick={logout}
          aria-label="Sign out"
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Sign Out
        </button>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'transactions' && <Transactions />}
        {page === 'accounts' && <Accounts />}
        {page === 'debts' && <Debts />}
      </main>
    </div>
  );
}
