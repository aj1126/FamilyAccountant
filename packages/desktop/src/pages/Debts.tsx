import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { Debt } from '@family-accountant/shared';

export function Debts() {
  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: () => apiClient.get('/debts').then((r) => r.data),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Debts</h1>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Description', 'Amount', 'Direction', 'Status'].map((h) => (
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
                <td style={tdStyle}>{debt.direction.replace('_', ' ')}</td>
                <td style={tdStyle}>
                  <span style={{ color: debt.settled ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {debt.settled ? 'Settled' : 'Outstanding'}
                  </span>
                </td>
              </tr>
            ))}
            {debts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '32px 16px' }}>
                  No debts recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
