import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/services/api.client';
import { Debt } from '@family-accountant/shared';

export default function DebtsScreen() {
  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: () => apiClient.get('/debts').then((r) => r.data),
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
            <Text style={styles.desc}>{item.description}</Text>
            <View>
              <Text style={styles.amount}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: item.currency,
                }).format(item.amount)}
              </Text>
              <Text style={[styles.badge, item.settled ? styles.settled : styles.outstanding]}>
                {item.settled ? 'Settled' : 'Outstanding'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No debts recorded</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  desc: { fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  amount: { fontSize: 15, fontWeight: '600', textAlign: 'right' },
  badge: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'right' },
  settled: { color: '#16a34a' },
  outstanding: { color: '#dc2626' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 15 },
});
