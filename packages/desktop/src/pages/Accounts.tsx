import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Account, AccountType, CreateAccountDto } from '@family-accountant/shared';

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit', 'cash', 'investment'];

export function Accounts() {
  const qc = useQueryClient();
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => apiClient.get('/accounts').then((r) => r.data),
  });

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('');
  const [formError, setFormError] = useState('');

  const createMutation = useMutation({
    mutationFn: (dto: CreateAccountDto) => apiClient.post('/accounts', dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setName('');
      setType('checking');
      setCurrency('USD');
      setBalance('');
      setFormError('');
    },
    onError: () => setFormError('Failed to create account. Please try again.'),
  });

  const handleAdd = () => {
    if (!name.trim()) {
      setFormError('Account name is required.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      type,
      currency: currency.trim() || 'USD',
      balance: balance ? parseFloat(balance) : 0,
    });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Accounts</h1>

      {/* New Account form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>New Account</h2>
        {formError && <p style={{ color: '#dc2626', marginBottom: 8, fontSize: 13 }}>{formError}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            style={inputStyle}
            placeholder="Account name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Account name"
          />
          <select
            style={{ ...inputStyle, flex: 'none', width: 150 }}
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            aria-label="Account type"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <input
            style={{ ...inputStyle, width: 80, flex: 'none' }}
            placeholder="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            aria-label="Currency"
          />
          <input
            style={{ ...inputStyle, width: 120, flex: 'none' }}
            placeholder="Opening balance"
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            aria-label="Opening balance"
          />
          <button
            onClick={handleAdd}
            disabled={createMutation.isPending}
            aria-label="Add account"
            style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            {createMutation.isPending ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Accounts table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Name', 'Type', 'Currency', 'Balance'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{acc.name}</td>
                <td style={tdStyle}>{acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}</td>
                <td style={tdStyle}>{acc.currency}</td>
                <td style={tdStyle}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: acc.currency }).format(acc.balance)}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '32px 16px' }}>
                  No accounts yet. Add your first account above.
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
  minWidth: 140,
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
