import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTransactionStore } from '../../src/stores/transaction.store';
import { SyncStatusBadge } from '../../src/components/SyncStatusBadge';

export default function DashboardScreen() {
  const transactions = useTransactionStore((s) => s.transactions);
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const pending = transactions.filter((t) => t.syncStatus === 'pending').length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Total Spent</Text>
        <Text style={styles.amount}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Pending Sync</Text>
        <Text style={styles.amount}>{pending} transaction(s)</Text>
      </View>
      {transactions.slice(0, 5).map((tx) => (
        <View key={tx.id} style={styles.txRow}>
          <View>
            <Text style={styles.txDesc}>{tx.description}</Text>
            <Text style={styles.txDate}>{tx.transactionDate}</Text>
          </View>
          <View style={styles.txRight}>
            <Text style={styles.txAmount}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(
                Number(tx.amount),
              )}
            </Text>
            <SyncStatusBadge status={tx.syncStatus as 'synced' | 'pending' | 'error'} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  label: { fontSize: 14, color: '#64748b' },
  amount: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  txDesc: { fontSize: 15, fontWeight: '500' },
  txDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '600' },
});
