import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback registered by the auth store to clear all auth state when a
// session is terminated by the interceptor. The indirection avoids a circular
// import between api.client ↔ auth.store.
let _onUnauthorized: (() => Promise<void> | void) | null = null;
export function setUnauthorizedHandler(cb: () => Promise<void> | void): void {
  _onUnauthorized = cb;
}

// Silently refresh the access token on 401 responses.
// Reads tokens directly from SecureStore to avoid a circular import with the auth store.
// Uses a plain axios instance (not apiClient) for the refresh call so that the request
// interceptor does not append the expired access token to the Authorization header.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await _onUnauthorized?.();
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.accessToken as string;
        await SecureStore.setItemAsync('accessToken', newToken);
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.refreshToken as string);
        }
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await _onUnauthorized?.();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
