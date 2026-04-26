import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/services/api.client';
import { AddDebtModal } from '../../src/components/AddDebtModal';
import { Debt } from '@family-accountant/shared';

export default function DebtsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: () => apiClient.get('/debts').then((r) => r.data),
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/debts/${id}/settle`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
    onError: () => Alert.alert('Error', 'Failed to settle debt. Please try again.'),
  });

  if (isLoading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Debts</Text>
      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.direction}>
                {item.direction === 'i_owe' ? 'I owe' : 'Owed to me'}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: item.currency,
                }).format(item.amount)}
              </Text>
              {item.settled ? (
                <Text style={[styles.badge, styles.settled]}>Settled</Text>
              ) : (
                <TouchableOpacity
                  style={styles.settleBtn}
                  onPress={() => settleMutation.mutate(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Settle debt: ${item.description}`}
                >
                  <Text style={styles.settleBtnText}>Settle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No debts recorded.</Text>
            <Text style={styles.emptyHint}>Tap + to record your first debt.</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Record debt"
        accessibilityHint="Opens a form to record a new debt"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddDebtModal visible={showModal} onClose={() => setShowModal(false)} />
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
  info: { flex: 1, marginRight: 8 },
  desc: { fontSize: 15, fontWeight: '500' },
  direction: { fontSize: 12, color: '#64748b', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '600' },
  badge: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  settled: { color: '#16a34a' },
  settleBtn: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#16a34a',
    borderRadius: 6,
  },
  settleBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
