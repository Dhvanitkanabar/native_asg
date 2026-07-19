import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Lock } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '@/hooks/ctx';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure foreground notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const unstable_settings = {
  anchor: '(drawer)',
};

function RootLayoutNav() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

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

  useEffect(() => {
    const seedContacts = async () => {
      try {
        const stored = await AsyncStorage.getItem('contactsList');
        if (!stored || JSON.parse(stored).length === 0) {
          const MOCK_CONTACTS = [
            { id: 'local-1', name: 'Alexander Wright', phoneNumbers: [{ number: '+1 (555) 234-5678' }], emails: [{ email: 'alex.wright@buildco.com' }], tag: 'Work' },
            { id: 'local-2', name: 'Sarah Jenkins', phoneNumbers: [{ number: '+1 (555) 876-5432' }], emails: [{ email: 'sarah.j@vertexgroup.org' }], tag: 'Family' },
            { id: 'local-3', name: 'David Miller', phoneNumbers: [{ number: '+1 (555) 345-6789' }], emails: [{ email: 'd.miller@safetyfirst.net' }], tag: 'Work' },
            { id: 'local-4', name: 'Elena Rostova', phoneNumbers: [{ number: '+1 (555) 987-6543' }], emails: [{ email: 'elena.rostova@designcorp.com' }], tag: 'Friends' },
            { id: 'local-5', name: 'Marcus Brody', phoneNumbers: [{ number: '+1 (555) 456-7890' }], emails: [{ email: 'm.brody@archsurvey.com' }], tag: 'Other' }
          ];
          await AsyncStorage.setItem('contactsList', JSON.stringify(MOCK_CONTACTS));
        }
      } catch (e) {
        console.log('Error seeding contacts:', e);
      }
    };
    seedContacts();
  }, []);

  const authenticate = async () => {
    try {
      // Check faceId settings
      const savedSettingsStr = await AsyncStorage.getItem('@app_settings');
      let requireBiometrics = true;
      if (savedSettingsStr) {
        const savedSettings = JSON.parse(savedSettingsStr);
        requireBiometrics = savedSettings.faceId !== false;
      }

      if (!requireBiometrics) {
        setIsUnlocked(true);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock app with biometrics',
        fallbackLabel: 'Use Device Passcode',
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isUnlocked) {
    return (
      <View style={[styles.lockedContainer, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary + '08', theme.accent + '05']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.lockIconContainer}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lockGradientCircle}
          >
            <Lock size={32} color="#fff" />
          </LinearGradient>
          <View style={[styles.lockSubPulse, { backgroundColor: theme.primary + '18' }]} />
        </View>

        <Text style={[styles.lockedTitle, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>
          Application Locked
        </Text>
        
        <Text style={[styles.lockedSubtitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
          Authentication is required to view your field survey data securely.
        </Text>

        <AppButton 
          title="Unlock with Biometrics" 
          onPress={authenticate} 
          style={styles.unlockBtn}
          icon={<Fingerprint size={18} color="#fff" />}
        />
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
    padding: Spacing.xl,
  },
  lockIconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  lockGradientCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  lockSubPulse: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    zIndex: 1,
  },
  lockedTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  lockedSubtitle: {
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
    marginBottom: Spacing.huge,
  },
  unlockBtn: {
    width: '80%',
  },
});
