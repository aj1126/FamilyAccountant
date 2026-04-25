import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../services/api.client';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  householdId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadTokens: () => Promise<void>;
}

async function hydrateUser(accessToken: string): Promise<{ userId: string; householdId: string | null }> {
  const { data } = await apiClient.get('/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { userId: data.id, householdId: data.householdId ?? null };
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  householdId: null,

  loadTokens: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const userId = await SecureStore.getItemAsync('userId');
    const householdId = await SecureStore.getItemAsync('householdId');
    set({ accessToken, refreshToken, userId, householdId: householdId ?? null });
  },

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { userId, householdId } = await hydrateUser(data.accessToken);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('userId', userId);
    if (householdId) await SecureStore.setItemAsync('householdId', householdId);
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken, userId, householdId });
  },

  register: async (email, password, displayName) => {
    const { data } = await apiClient.post('/auth/register', { email, password, displayName });
    const { userId, householdId } = await hydrateUser(data.accessToken);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('userId', userId);
    if (householdId) await SecureStore.setItemAsync('householdId', householdId);
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken, userId, householdId });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('householdId');
    set({ accessToken: null, refreshToken: null, userId: null, householdId: null });
  },
}));
