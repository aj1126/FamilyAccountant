import React from 'react';
import type { SyncStatus } from '@family-accountant/shared';

interface Props {
  status: SyncStatus;
}

const LABELS: Record<SyncStatus, string> = {
  synced: '✓ synced',
  pending: '⏳ pending',
  error: '✗ error',
};

const COLORS: Record<SyncStatus, string> = {
  synced: '#16a34a',
  pending: '#d97706',
  error: '#dc2626',
};

export function SyncStatusBadge({ status }: Props) {
  return (
    <span style={{ color: COLORS[status], fontWeight: 600, fontSize: 12 }}>{LABELS[status]}</span>
  );
}
