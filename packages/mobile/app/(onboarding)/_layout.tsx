import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="household" options={{ title: 'Set Up Your Household', headerBackVisible: false }} />
    </Stack>
  );
}
