import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTransactionStore } from '../stores/transaction.store';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../services/api.client';
import { v4 as uuidv4 } from 'uuid';
import { Account } from '@family-accountant/shared';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const householdId = useAuthStore((s) => s.householdId);
  const userId = useAuthStore((s) => s.userId);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => apiClient.get('/accounts').then((r) => r.data),
    enabled: visible,
  });

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!description || isNaN(parsedAmount)) {
      Alert.alert('Validation', 'Please enter a description and valid amount');
      return;
    }
    if (!householdId || !userId) {
      Alert.alert('No Household', 'Please join or create a household first');
      return;
    }

    try {
      const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
      const currency = selectedAccount ? selectedAccount.currency : 'USD';

      await addTransaction({
        localId: uuidv4(),
        accountId: selectedAccountId,
        householdId,
        userId,
        amount: parsedAmount,
        currency,
        description,
        category,
        transactionDate: new Date().toISOString().split('T')[0],
        deletedAt: null,
      });
      setDescription('');
      setAmount('');
      setCategory('');
      setSelectedAccountId(undefined);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add Transaction</Text>
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            accessibilityLabel="Description"
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            accessibilityLabel="Amount"
          />
          <TextInput
            style={styles.input}
            placeholder="Category (optional)"
            value={category}
            onChangeText={setCategory}
            accessibilityLabel="Category"
          />

          {/* Account picker */}
          {accounts.length > 0 && (
            <>
              <Text style={styles.label}>Account (optional)</Text>
              <View style={styles.accountRow}>
                <TouchableOpacity
                  style={[styles.accountChip, !selectedAccountId && styles.accountChipSelected]}
                  onPress={() => setSelectedAccountId(undefined)}
                  accessibilityRole="button"
                  accessibilityLabel="No account"
                >
                  <Text style={[styles.chipText, !selectedAccountId && styles.chipTextSelected]}>
                    None
                  </Text>
                </TouchableOpacity>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accountChip, selectedAccountId === acc.id && styles.accountChipSelected]}
                    onPress={() => setSelectedAccountId(acc.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Account: ${acc.name}`}
                  >
                    <Text style={[styles.chipText, selectedAccountId === acc.id && styles.chipTextSelected]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} accessibilityRole="button">
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  accountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  accountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  accountChipSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#64748b' },
  chipTextSelected: { color: '#2563eb', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { padding: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#64748b', fontSize: 15 },
});
