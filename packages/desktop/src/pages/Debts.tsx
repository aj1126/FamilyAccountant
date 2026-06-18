import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { useAuthStore } from '../stores/auth.store';
import { Debt, DebtDirection, CreateDebtDto } from '@family-accountant/shared';

const DIRECTIONS: { value: DebtDirection; label: string }[] = [
  { value: 'owed_to_me', label: 'Owed to me' },
  { value: 'i_owe', label: 'I owe' },
];

export function Debts() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: () => apiClient.get('/debts').then((r) => r.data),
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/households/members').then((r) => r.data),
  });

  const otherMembers = members.filter((m) => m.id !== userId);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [direction, setDirection] = useState<DebtDirection>('i_owe');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (otherMembers.length > 0 && !counterpartyId) {
      setCounterpartyId(otherMembers[0].id);
    }
  }, [otherMembers, counterpartyId]);

  const createMutation = useMutation({
    mutationFn: (body: CreateDebtDto) =>
      apiClient.post('/debts', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      setDescription('');
      setAmount('');
      setCurrency('USD');
      setDirection('i_owe');
      if (otherMembers.length > 0) {
        setCounterpartyId(otherMembers[0].id);
      } else {
        setCounterpartyId('');
      }
      setFormError('');
    },
    onError: () => setFormError('Failed to create debt. Please try again.'),
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/debts/${id}/settle`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      setFormError('');
    },
    onError: () => setFormError('Failed to settle debt. Please try again.'),
  });

  const handleAdd = () => {
    const parsed = parseFloat(amount);
    if (!description.trim() || isNaN(parsed) || parsed <= 0) {
      setFormError('Please enter a description and a valid amount.');
      return;
    }
    if (!userId) {
      setFormError('User not identified. Please log in again.');
      return;
    }
    if (!counterpartyId) {
      setFormError('Please select a household member as the counterparty.');
      return;
    }
    
    const creditorId = direction === 'i_owe' ? counterpartyId : userId;
    const debtorId = direction === 'i_owe' ? userId : counterpartyId;

    createMutation.mutate({
      description: description.trim(),
      amount: parsed,
      currency: currency.trim() || 'USD',
      direction,
      creditorId,
      debtorId,
    });
  };

  const getCounterpartyName = (debt: Debt) => {
    const cpId = debt.creditorId === userId ? debt.debtorId : debt.creditorId;
    const member = members.find((m) => m.id === cpId);
    return member ? (member.displayName || member.email) : 'Unknown User';
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Debts</h1>

      {/* New Debt form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Record Debt</h2>
        {formError && <p style={{ color: '#dc2626', marginBottom: 8, fontSize: 13 }}>{formError}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            style={inputStyle}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Debt description"
          />
          <input
            style={{ ...inputStyle, flex: 'none', width: 120 }}
            placeholder="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Debt amount"
          />
          <input
            style={{ ...inputStyle, flex: 'none', width: 80 }}
            placeholder="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            aria-label="Currency"
          />
          <select
            style={{ ...inputStyle, flex: 'none', width: 150 }}
            value={direction}
            onChange={(e) => setDirection(e.target.value as DebtDirection)}
            aria-label="Direction"
          >
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <select
            style={{ ...inputStyle, flex: 'none', width: 180 }}
            value={counterpartyId}
            onChange={(e) => setCounterpartyId(e.target.value)}
            aria-label="Household Member"
          >
            {otherMembers.length === 0 ? (
              <option value="">No other members</option>
            ) : (
              otherMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName || m.email}</option>
              ))
            )}
          </select>
          <button
            onClick={handleAdd}
            disabled={createMutation.isPending}
            aria-label="Record debt"
            style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            {createMutation.isPending ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Debts table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Description', 'Amount', 'Direction', 'Status', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{debt.description}</td>
                <td style={tdStyle}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.amount)}
                </td>
                <td style={tdStyle}>
                  {debt.direction === 'i_owe' ? `I owe ${getCounterpartyName(debt)}` : `${getCounterpartyName(debt)} owes me`}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: debt.settled ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {debt.settled ? 'Settled' : 'Outstanding'}
                  </span>
                </td>
                <td style={tdStyle}>
                  {!debt.settled && (
                    <button
                      onClick={() => settleMutation.mutate(debt.id)}
                      disabled={settleMutation.isPending}
                      aria-label={`Settle debt: ${debt.description}`}
                      style={{
                        padding: '4px 12px',
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Settle
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {debts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '32px 16px' }}>
                  No debts recorded. Use the form above to add one.
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
