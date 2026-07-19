import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, AppState, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '@/hooks/ctx';

export const unstable_settings = {
  anchor: '(drawer)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    authenticate();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current === 'background' &&
        nextAppState === 'active'
      ) {
        setIsUnlocked(false);
        authenticate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If device has no biometrics, just unlock
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock App',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsUnlocked(true);
      } else {
        console.log('Authentication failed or cancelled.');
      }
    } catch (error) {
      console.log('Authentication error:', error);
      Alert.alert('Authentication Error', error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(drawer)/(tabs)' as any);
    }
  }, [session, isLoading, segments]);

  if (!isUnlocked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedTitle}>App Locked</Text>
        <Text style={styles.lockedSubtitle}>Use FaceID/Fingerprint to open</Text>
        <Button title="Unlock App" onPress={authenticate} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});
