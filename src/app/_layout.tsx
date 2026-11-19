import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { errorMessage, notify } from '../lib/dialog';
import { loadBoxes } from '../lib/store';
import { colors } from '../lib/theme';

export default function RootLayout() {
  useEffect(() => {
    loadBoxes().catch((e) => notify("Couldn't load your boxes", errorMessage(e)));
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="boxes" options={{ title: 'My boxes' }} />
        <Stack.Screen name="box/[id]" options={{ title: 'Box' }} />
        <Stack.Screen name="edit" options={{ title: 'New box' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan a box' }} />
        <Stack.Screen name="backup" options={{ title: 'Backup & restore' }} />
      </Stack>
    </>
  );
}
