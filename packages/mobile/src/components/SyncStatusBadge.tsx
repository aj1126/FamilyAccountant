import React from 'react';
import { Text, StyleSheet } from 'react-native';
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
    <Text style={[styles.badge, { color: COLORS[status] }]}>{LABELS[status]}</Text>
  );
}

const styles = StyleSheet.create({
  badge: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
