import { create } from 'zustand';
import { apiClient, setAuthToken, setUnauthorizedHandler } from '../services/api.client';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  householdId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loadTokens: () => void;
  setHouseholdId: (householdId: string) => void;
}

async function hydrateUser(accessToken: string): Promise<{ userId: string; householdId: string | null }> {
  const { data } = await apiClient.get('/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { userId: data.id as string, householdId: (data.householdId as string | null) ?? null };
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  householdId: null,

  loadTokens: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = localStorage.getItem('userId');
    const householdId = localStorage.getItem('householdId');
    if (accessToken) setAuthToken(accessToken);
    set({ accessToken, refreshToken, userId, householdId });
  },

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { userId, householdId } = await hydrateUser(data.accessToken as string);
    localStorage.setItem('accessToken', data.accessToken as string);
    localStorage.setItem('refreshToken', data.refreshToken as string);
    localStorage.setItem('userId', userId);
    if (householdId) localStorage.setItem('householdId', householdId);
    setAuthToken(data.accessToken as string);
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken, userId, householdId });
  },

  register: async (email, password, displayName) => {
    const { data } = await apiClient.post('/auth/register', { email, password, displayName });
    const { userId, householdId } = await hydrateUser(data.accessToken as string);
    localStorage.setItem('accessToken', data.accessToken as string);
    localStorage.setItem('refreshToken', data.refreshToken as string);
    localStorage.setItem('userId', userId);
    if (householdId) localStorage.setItem('householdId', householdId);
    setAuthToken(data.accessToken as string);
    set({ accessToken: data.accessToken, refreshToken: data.refreshToken, userId, householdId });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('householdId');
    setAuthToken(null);
    set({ accessToken: null, refreshToken: null, userId: null, householdId: null });
  },

  setHouseholdId: (householdId: string) => {
    localStorage.setItem('householdId', householdId);
    set({ householdId });
  },
}));

// Clear in-memory auth state when the 401 interceptor terminates a session.
// Storage has already been cleared by the interceptor at this point.
setUnauthorizedHandler(() => {
  useAuthStore.setState({ accessToken: null, refreshToken: null, userId: null, householdId: null });
});
