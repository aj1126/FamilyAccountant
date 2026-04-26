import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../../src/services/api.client';
import { useAuthStore } from '../../src/stores/auth.store';

type Mode = 'choose' | 'create' | 'join';

export default function HouseholdOnboardingScreen() {
  const [mode, setMode] = useState<Mode>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [loading, setLoading] = useState(false);

  const setHouseholdInStore = useAuthStore((s) => s.setHouseholdId);
  const accessToken = useAuthStore((s) => s.accessToken);

  const handleCreate = async () => {
    if (!householdName.trim()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        '/households',
        { name: householdName.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await setHouseholdInStore(data.id as string);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Could not create household. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!householdId.trim()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        '/households/join',
        { householdId: householdId.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await setHouseholdInStore(data.id as string);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Household not found. Check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Set Up Your Household</Text>
      <Text style={styles.subtitle}>
        Create a new household or join one that a family member has already set up.
      </Text>

      {mode === 'choose' && (
        <View style={styles.choiceContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setMode('create')}>
            <Text style={styles.primaryButtonText}>Create a new household</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('join')}>
            <Text style={styles.secondaryButtonText}>Join an existing household</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'create' && (
        <View>
          <Text style={styles.label}>Household Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Johnson Family"
            value={householdName}
            onChangeText={setHouseholdName}
            autoFocus
            maxLength={80}
          />
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creating…' : 'Create Household'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => setMode('choose')}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'join' && (
        <View>
          <Text style={styles.label}>Household ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste the household ID here"
            value={householdId}
            onChangeText={setHouseholdId}
            autoFocus
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleJoin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Joining…' : 'Join Household'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => setMode('choose')}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 36, lineHeight: 22 },
  choiceContainer: { gap: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '500' },
  disabledButton: { backgroundColor: '#93c5fd' },
  backLink: { alignItems: 'center', marginTop: 8 },
  backLinkText: { color: '#2563eb', fontSize: 14 },
});
