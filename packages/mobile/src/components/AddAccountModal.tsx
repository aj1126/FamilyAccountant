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
import { AccountType, CreateAccountDto } from '@family-accountant/shared';

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit', 'cash', 'investment'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddAccountModal({ visible, onClose }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter an account name.');
      return;
    }
    const trimmedBalance = balance.trim();
    const parsedBalance = trimmedBalance ? parseFloat(trimmedBalance) : 0;
    if (!Number.isFinite(parsedBalance)) {
      Alert.alert('Validation', 'Please enter a valid opening balance.');
      return;
    }
    const dto: CreateAccountDto = {
      name: name.trim(),
      type,
      currency: currency.trim() || 'USD',
      balance: parsedBalance,
    };
    try {
      await apiClient.post('/accounts', dto);
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setName('');
      setType('checking');
      setCurrency('USD');
      setBalance('');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Account name"
            value={name}
            onChangeText={setName}
            accessibilityLabel="Account name"
          />

          {/* Type picker */}
          <Text style={styles.label}>Account type</Text>
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipSelected]}
                onPress={() => setType(t)}
                accessibilityRole="button"
                accessibilityLabel={`Account type: ${t}`}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Currency (e.g. USD)"
            value={currency}
            onChangeText={(v) => setCurrency(v.toUpperCase())}
            maxLength={3}
            autoCapitalize="characters"
            accessibilityLabel="Currency"
          />
          <TextInput
            style={styles.input}
            placeholder="Opening balance (optional)"
            keyboardType="decimal-pad"
            value={balance}
            onChangeText={setBalance}
            accessibilityLabel="Opening balance"
          />

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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeChipSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeChipText: { fontSize: 13, color: '#64748b' },
  typeChipTextSelected: { color: '#2563eb', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { padding: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#64748b', fontSize: 15 },
});
