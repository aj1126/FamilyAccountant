import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import { useAuthStore } from '../stores/auth.store';
import { CreateDebtDto, DebtDirection } from '@family-accountant/shared';

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

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ['members'],
    queryFn: () => apiClient.get('/households/members').then((r) => r.data),
  });

  const otherMembers = members.filter((m) => m.id !== userId);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [direction, setDirection] = useState<DebtDirection>('i_owe');
  const [counterpartyId, setCounterpartyId] = useState('');

  useEffect(() => {
    if (otherMembers.length > 0 && !counterpartyId) {
      setCounterpartyId(otherMembers[0].id);
    }
  }, [otherMembers, counterpartyId]);

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
    if (!counterpartyId) {
      Alert.alert('Validation', 'Please select a household member as the counterparty.');
      return;
    }
    try {
      const creditorId = direction === 'i_owe' ? counterpartyId : userId;
      const debtorId = direction === 'i_owe' ? userId : counterpartyId;

      const body: CreateDebtDto = {
        description: description.trim(),
        amount: parsedAmount,
        currency: currency.trim() || 'USD',
        direction,
        creditorId,
        debtorId,
      };
      await apiClient.post('/debts', body);
      qc.invalidateQueries({ queryKey: ['debts'] });
      setDescription('');
      setAmount('');
      setCurrency('USD');
      setDirection('i_owe');
      if (otherMembers.length > 0) {
        setCounterpartyId(otherMembers[0].id);
      } else {
        setCounterpartyId('');
      }
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

          {/* Household member picker */}
          <Text style={styles.label}>Household Member</Text>
          {otherMembers.length === 0 ? (
            <Text style={styles.noMembersText}>No other members found in household.</Text>
          ) : (
            <View style={styles.membersRow}>
              {otherMembers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, counterpartyId === m.id && styles.chipSelected]}
                  onPress={() => setCounterpartyId(m.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Member: ${m.displayName || m.email}`}
                >
                  <Text style={[styles.chipText, counterpartyId === m.id && styles.chipTextSelected]}>
                    {m.displayName || m.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  memberChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  noMembersText: { fontSize: 14, color: '#94a3b8', marginBottom: 16, fontStyle: 'italic' },
});
