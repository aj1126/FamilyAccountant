import React, { useState } from 'react';
import { useAuthStore } from '../stores/auth.store';

type Tab = 'login' | 'register';

interface Props {
  onAuthenticated: () => void;
}

export function Login({ onAuthenticated }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      onAuthenticated();
    } catch {
      setError(tab === 'login' ? 'Invalid email or password.' : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderBottom: tab === t ? '2px solid #2563eb' : '2px solid #e2e8f0',
    background: 'transparent',
    fontWeight: tab === t ? 700 : 400,
    color: tab === t ? '#2563eb' : '#64748b',
    cursor: 'pointer',
    fontSize: 15,
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: 40,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
          FamilyAccountant
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 28, fontSize: 14 }}>
          Home finance for families
        </p>

        <div style={{ display: 'flex', marginBottom: 24 }}>
          <button style={tabStyle('login')} onClick={() => setTab('login')}>
            Sign In
          </button>
          <button style={tabStyle('register')} onClick={() => setTab('register')}>
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <input
              style={inputStyle}
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
            />
          )}
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '11px 14px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 15,
  marginBottom: 14,
  boxSizing: 'border-box',
};
