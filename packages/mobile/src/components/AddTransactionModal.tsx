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
import { useTransactionStore } from '../stores/transaction.store';
import { useAuthStore } from '../stores/auth.store';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const householdId = useAuthStore((s) => s.householdId);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!description || isNaN(parsedAmount)) {
      Alert.alert('Validation', 'Please enter a description and valid amount');
      return;
    }
    if (!householdId) {
      Alert.alert('No Household', 'Please join or create a household first');
      return;
    }

    try {
      await addTransaction({
        localId: uuidv4(),
        accountId: undefined,
        householdId,
        amount: parsedAmount,
        currency: 'USD',
        description,
        category,
        transactionDate: new Date().toISOString().split('T')[0],
        deletedAt: null,
      });
      setDescription('');
      setAmount('');
      setCategory('');
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
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={styles.input}
            placeholder="Category (optional)"
            value={category}
            onChangeText={setCategory}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
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
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { padding: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#64748b', fontSize: 15 },
});
