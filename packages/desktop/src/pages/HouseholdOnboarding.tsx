import React, { useState } from 'react';
import { apiClient } from '../services/api.client';
import { useAuthStore } from '../stores/auth.store';

type Mode = 'choose' | 'create' | 'join';

export function HouseholdOnboarding() {
  const [mode, setMode] = useState<Mode>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setHouseholdInStore = useAuthStore((s) => s.setHouseholdId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/households', { name: householdName });
      setHouseholdInStore(data.id as string);
    } catch {
      setError('Could not create household. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/households/join', { householdId });
      setHouseholdInStore(data.id as string);
    } catch {
      setError('Household not found. Check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: 420,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Set Up Your Household</h1>
        <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>
          Create a new household or join one that a family member has already set up.
        </p>

        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button style={primaryBtn} onClick={() => setMode('create')}>
              Create a new household
            </button>
            <button style={secondaryBtn} onClick={() => setMode('join')}>
              Join an existing household
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <label style={labelStyle}>Household name</label>
            <input
              style={inputStyle}
              placeholder="e.g. The Johnson Family"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoFocus
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? 'Creating…' : 'Create Household'}
            </button>
            <button type="button" style={{ ...secondaryBtn, marginTop: 8 }} onClick={() => { setMode('choose'); setError(''); }}>
              Back
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin}>
            <label style={labelStyle}>Household ID</label>
            <input
              style={inputStyle}
              placeholder="Paste the household ID here"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              required
              autoFocus
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? 'Joining…' : 'Join Household'}
            </button>
            <button type="button" style={{ ...secondaryBtn, marginTop: 8 }} onClick={() => { setMode('choose'); setError(''); }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px 0',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '11px 0',
  background: '#fff',
  color: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
};

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: 13,
  marginBottom: 12,
};
