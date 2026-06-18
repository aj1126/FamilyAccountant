import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Debts } from './pages/Debts';
import { Accounts } from './pages/Accounts';
import { Login } from './pages/Login';
import { HouseholdOnboarding } from './pages/HouseholdOnboarding';
import { useAuthStore } from './stores/auth.store';
import { useTransactionStore } from './stores/transaction.store';
import { apiClient } from './services/api.client';

// Load tokens synchronously from localStorage before any component renders
// so the app never shows a blank frame waiting for a useEffect to fire.
// This is safe in Electron (localStorage is always available in the renderer process).
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  useAuthStore.getState().loadTokens();
}

type Page = 'dashboard' | 'transactions' | 'debts' | 'accounts';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [verifying, setVerifying] = useState(true);

  const accessToken = useAuthStore((s) => s.accessToken);
  const householdId = useAuthStore((s) => s.householdId);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    // 1. App Hydration: Load cached transactions from SQLite immediately
    useTransactionStore.getState().loadFromDb().catch(console.error);

    async function verifySession() {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        setVerifying(false);
        return;
      }
      try {
        const { data } = await apiClient.get('/users/me');
        useAuthStore.setState({
          userId: data.id,
          householdId: data.householdId ?? null,
        });
        localStorage.setItem('userId', data.id);
        if (data.householdId) {
          localStorage.setItem('householdId', data.householdId);
        } else {
          localStorage.removeItem('householdId');
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          useAuthStore.getState().logout();
        } else if (!err.response) {
          console.log('Desktop offline: using cached session');
        }
      } finally {
        setVerifying(false);
      }
    }
    verifySession();
  }, []);

  // Sync on Reconnect: listen to network status changes and auto-sync when online
  useEffect(() => {
    if (!accessToken) return;

    const handleOnline = () => {
      useTransactionStore
        .getState()
        .syncWithServer()
        .catch((err) => {
          console.error('Reconnect sync failed:', err);
        });
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [accessToken]);

  if (verifying && accessToken) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 18, color: '#2563eb', fontWeight: 600 }}>Loading session...</div>
      </div>
    );
  }

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
          onClick={() => window.electronAPI.openHelp()}
          aria-label="Help Documentation"
          style={{
            marginLeft: 'auto',
            marginRight: 10,
            padding: '6px 14px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Help & Docs
        </button>
        <button
          onClick={logout}
          aria-label="Sign out"
          style={{
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
