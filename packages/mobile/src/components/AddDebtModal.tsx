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
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { useAuthStore } from '../stores/auth.store';
import { DebtDirection } from '@family-accountant/shared';

const DIRECTIONS: { value: DebtDirection; label: string }[] = [
  { value: 'i_owe', label: 'I owe' },
  { value: 'owed_to_me', label: 'Owed to me' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddDebtModal({ visible, onClose }: Props) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [direction, setDirection] = useState<DebtDirection>('i_owe');

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Please enter a description and a valid amount.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'User not identified. Please log in again.');
      return;
    }
    try {
      await apiClient.post('/debts', {
        description: description.trim(),
        amount: parsedAmount,
        currency: currency.trim() || 'USD',
        direction,
        // Use current user's ID for both until multi-user lookup is built.
        creditorId: userId,
        debtorId: userId,
      });
      qc.invalidateQueries({ queryKey: ['debts'] });
      setDescription('');
      setAmount('');
      setCurrency('USD');
      setDirection('i_owe');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to record debt. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Record Debt</Text>

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            accessibilityLabel="Debt description"
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            accessibilityLabel="Debt amount"
          />
          <TextInput
            style={styles.input}
            placeholder="Currency (e.g. USD)"
            value={currency}
            onChangeText={(v) => setCurrency(v.toUpperCase())}
            maxLength={3}
            autoCapitalize="characters"
            accessibilityLabel="Currency"
          />

          {/* Direction picker */}
          <Text style={styles.label}>Direction</Text>
          <View style={styles.dirRow}>
            {DIRECTIONS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.chip, direction === d.value && styles.chipSelected]}
                onPress={() => setDirection(d.value)}
                accessibilityRole="button"
                accessibilityLabel={`Direction: ${d.label}`}
              >
                <Text style={[styles.chipText, direction === d.value && styles.chipTextSelected]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
  dirRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  chip: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  chipSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 14, color: '#64748b' },
  chipTextSelected: { color: '#2563eb', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { padding: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#64748b', fontSize: 15 },
});
