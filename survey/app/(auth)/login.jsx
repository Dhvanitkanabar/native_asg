import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSession } from '@/hooks/ctx';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppCard } from '@/components/ui/AppCard';

export default function Login() {
  const { signIn } = useSession();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const usersStr = await AsyncStorage.getItem('@users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

      if (!user) {
        Alert.alert("Error", "No account found with this email. Please sign up.");
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        Alert.alert("Error", "Incorrect password.");
        setLoading(false);
        return;
      }

      // Generate user profile
      const newProfile = {
        name: email.split('@')[0],
        role: 'Field Inspector',
        email: email.trim(),
        photoUri: null,
      };
      await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));

      signIn();
    } catch (e) {
      Alert.alert("Error", "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={colorScheme === 'dark' ? ['#0F172A', '#1E1B4B'] : ['#EEF2FF', '#E0E7FF']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header Branding */}
          <View style={styles.headerContainer}>
            <View style={[styles.logoIconBg, { backgroundColor: theme.primary + '18' }]}>
              <ShieldCheck size={36} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                  fontFamily: Typography.fontFamily.black,
                  fontSize: Typography.fontSize.h1,
                },
              ]}
            >
              Smart Survey
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                  fontFamily: Typography.fontFamily.medium,
                  fontSize: Typography.fontSize.md,
                },
              ]}
            >
              Sign in to manage and secure field reports
            </Text>
          </View>

          {/* Form Card */}
          <AppCard variant="glass" style={styles.formCard}>
            <AppInput
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
              icon={<Mail size={20} color={theme.textTertiary} />}
            />

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry
              error={errors.password}
              icon={<Lock size={20} color={theme.textTertiary} />}
            />

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <AppButton
              title="Create Account"
              onPress={() => router.replace('/signup')}
              variant="outline"
              style={styles.signupButton}
            />
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.huge,
  },
  logoIconBg: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    width: '100%',
    padding: Spacing.xl,
  },
  button: {
    marginTop: Spacing.md,
  },
  signupButton: {
    marginTop: Spacing.sm,
  },
});
