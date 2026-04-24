import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../services/api.client';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,

  loadTokens: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    set({ accessToken, refreshToken });
  },

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  },

  register: async (email, password, displayName) => {
    const { data } = await apiClient.post('/auth/register', { email, password, displayName });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ accessToken: null, refreshToken: null });
  },
}));
