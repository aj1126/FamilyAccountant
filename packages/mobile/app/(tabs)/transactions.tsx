import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useTransactionStore } from '../../src/stores/transaction.store';
import { SyncStatusBadge } from '../../src/components/SyncStatusBadge';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';

export default function TransactionsScreen() {
  const transactions = useTransactionStore((s) => s.transactions);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search transactions..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>{item.transactionDate}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: item.currency,
                }).format(Number(item.amount))}
              </Text>
              <SyncStatusBadge status={item.syncStatus as 'synced' | 'pending' | 'error'} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddTransactionModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: {
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  desc: { fontSize: 15, fontWeight: '500' },
  date: { fontSize: 12, color: '#64748b', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
