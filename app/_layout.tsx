import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { SecurityBlockedScreen } from '@/components/SecurityBlockedScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { detectFrida, isFridaDetectionAvailable } from '@/lib/fridaDetection';
import { initializeAppSecurity } from '@/lib/securityInit';

const FRIDA_RECHECK_INTERVAL_MS = 45_000;

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [securityReady, setSecurityReady] = useState(false);
  const [fridaDetected, setFridaDetected] = useState(false);

  useEffect(() => {
    initializeAppSecurity()
      .then(({ fridaDetected: detected }) => {
        setFridaDetected(detected);
      })
      .finally(() => {
        setSecurityReady(true);
      });
  }, []);

  useEffect(() => {
    if (!securityReady || fridaDetected || !isFridaDetectionAvailable()) {
      return;
    }

    const recheck = async () => {
      const detected = await detectFrida();
      if (detected) {
        setFridaDetected(true);
      }
    };

    const intervalId = setInterval(recheck, FRIDA_RECHECK_INTERVAL_MS);

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        recheck();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [securityReady, fridaDetected]);

  if (!securityReady) {
    return null;
  }

  if (fridaDetected) {
    return <SecurityBlockedScreen reason="frida" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
