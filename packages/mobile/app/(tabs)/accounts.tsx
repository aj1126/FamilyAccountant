import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/services/api.client';
import { AddAccountModal } from '../../src/components/AddAccountModal';
import { Account } from '@family-accountant/shared';

export default function AccountsScreen() {
  const [showModal, setShowModal] = useState(false);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => apiClient.get('/accounts').then((r) => r.data),
  });

  if (isLoading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Accounts</Text>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.balance}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: item.currency,
                }).format(item.balance)}
              </Text>
              <Text style={styles.currency}>{item.currency}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No accounts yet.</Text>
            <Text style={styles.emptyHint}>Tap + to add your first account.</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Add account"
        accessibilityHint="Opens a form to create a new account"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddAccountModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', margin: 16 },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  name: { fontSize: 15, fontWeight: '600' },
  type: { fontSize: 12, color: '#64748b', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  balance: { fontSize: 15, fontWeight: '600' },
  currency: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  empty: { fontSize: 16, color: '#64748b' },
  emptyHint: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
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
