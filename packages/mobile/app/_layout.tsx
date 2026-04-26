import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/stores/auth.store';
import { initDatabase } from '../src/db/database';

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
      } catch {
        // bootstrap errors are non-recoverable; still mark ready so the
        // redirect effect runs and sends the user to the login screen
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

  if (!ready) return null;

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <BootstrappedStack />
    </QueryClientProvider>
  );
}
