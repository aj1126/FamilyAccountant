import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/stores/auth.store';
import { useTransactionStore } from '../src/stores/transaction.store';
import { initDatabase } from '../src/db/database';
import { apiClient } from '../src/services/api.client';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

const queryClient = new QueryClient();

function BootstrappedStack() {
  const [ready, setReady] = useState(false);
  const loadTokens = useAuthStore((s) => s.loadTokens);
  const accessToken = useAuthStore((s) => s.accessToken);
  const householdId = useAuthStore((s) => s.householdId);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        await loadTokens();

        // 1. App Hydration: Load cached transactions from SQLite immediately
        await useTransactionStore.getState().loadFromDb();

        // 2. Validate token on startup by querying GET /users/me
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken) {
          try {
            const { data } = await apiClient.get('/users/me');
            
            // Sync/update user profile details in store and secure store
            useAuthStore.setState({
              userId: data.id,
              householdId: data.householdId ?? null,
            });
            await SecureStore.setItemAsync('userId', data.id);
            if (data.householdId) {
              await SecureStore.setItemAsync('householdId', data.householdId);
            } else {
              await SecureStore.deleteItemAsync('householdId');
            }
          } catch (err: any) {
            // Check if it's a validation error or network error
            if (err.response?.status === 401) {
              // The API interceptor will also catch this and log out, but we double-verify here
              await useAuthStore.getState().logout();
            } else if (!err.response) {
              // Network/offline error - allow using cached credentials and load offline cache
              console.log('App offline, bootstrapping with cached credentials');
            } else {
              // Server/other error
              throw err;
            }
          }
        }
      } catch (error: any) {
        Alert.alert(
          'Startup Error',
          'Failed to initialize application: ' + (error?.message || error)
        );
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, [loadTokens]);

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace('/(auth)/login');
    } else if (!householdId) {
      router.replace('/(onboarding)/household');
    } else {
      router.replace('/(tabs)');
    }
  }, [ready, accessToken, householdId]);

  // Sync on Reconnect: listen to network status changes and auto-sync when online
  useEffect(() => {
    if (!ready || !accessToken) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        useTransactionStore
          .getState()
          .syncWithServer()
          .catch((err) => {
            console.error('Reconnect sync failed:', err);
          });
      }
    });

    return () => unsubscribe();
  }, [ready, accessToken]);

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <BootstrappedStack />
    </QueryClientProvider>
  );
}
