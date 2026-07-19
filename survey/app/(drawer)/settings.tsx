import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Switch, 
  TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  Bell, Mail, Fingerprint, MapPin, Lock, HelpCircle, 
  FileText, LogOut, ChevronRight, Settings 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSession } from '@/hooks/ctx';
import * as Haptics from 'expo-haptics';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signOut } = useSession();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    faceId: true,
    locationTracking: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@app_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      console.log('Failed to load settings', e);
    }
  };

  const toggleSetting = async (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: !(settings as any)[key] };
    setSettings(updated);
    try {
      await AsyncStorage.setItem('@app_settings', JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save settings', e);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: () => signOut()
      }
    ]);
  };

  const renderToggleRow = (icon: React.ReactNode, title: string, subtitle: string | null, settingKey: string, color: string) => (
    <View style={styles.row}>
      <View style={[styles.iconContainer, { backgroundColor: color + '12' }]}>
        {icon}
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowTitle, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={(settings as any)[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={'#fff'}
      />
    </View>
  );

  const renderLinkRow = (icon: React.ReactNode, title: string, color: string, onPress: () => void) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }} 
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '12' }]}>
        {icon}
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowTitle, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>{title}</Text>
      </View>
      <ChevronRight size={18} color={theme.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      <AppHeader title="Settings" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Notifications</Text>
        <AppCard variant="elevated" style={styles.card}>
          {renderToggleRow(
            <Bell size={18} color={theme.primary} />, 
            'Push Notifications', 
            'Receive alerts on your device', 
            'pushNotifications', 
            theme.primary
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {renderToggleRow(
            <Mail size={18} color={theme.success} />, 
            'Email Summaries', 
            'Weekly operations summaries', 
            'emailNotifications', 
            theme.success
          )}
        </AppCard>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Privacy & Security</Text>
        <AppCard variant="elevated" style={styles.card}>
          {renderToggleRow(
            <Fingerprint size={18} color={theme.accent} />, 
            'Biometric Lock', 
            'Lock application using FaceID/TouchID', 
            'faceId', 
            theme.accent
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {renderToggleRow(
            <MapPin size={18} color={theme.warning} />, 
            'Location Auto-Tag', 
            'Attach coordinates to survey forms', 
            'locationTracking', 
            theme.warning
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {renderLinkRow(
            <Lock size={18} color={theme.primary} />, 
            'Change Passcode', 
            theme.primary, 
            () => Alert.alert('Passcode Reset', 'Passcode request instructions sent to your email.')
          )}
        </AppCard>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Support</Text>
        <AppCard variant="elevated" style={styles.card}>
          {renderLinkRow(
            <HelpCircle size={18} color={theme.success} />, 
            'Help Center', 
            theme.success, 
            () => Alert.alert('Help Desk', 'Connecting to support services...')
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {renderLinkRow(
            <FileText size={18} color={theme.textSecondary} />, 
            'Terms of Service', 
            theme.textSecondary, 
            () => Alert.alert('TOS', 'Opening Terms and Disclaimers document...')
          )}
        </AppCard>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Account Actions</Text>
        <AppCard variant="elevated" style={styles.card}>
          {renderLinkRow(
            <LogOut size={18} color={theme.danger} />, 
            'Log Out Profile', 
            theme.danger, 
            handleLogout
          )}
        </AppCard>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textTertiary, fontFamily: Typography.fontFamily.medium }]}>Survey Manager v1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { paddingVertical: Spacing.xs, borderRadius: Radius.md, borderWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  iconContainer: {
    width: 36, height: 36, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  rowTextContainer: { flex: 1 },
  rowTitle: { fontSize: Typography.fontSize.md },
  rowSubtitle: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  divider: { height: 1, marginLeft: 66 },
  versionContainer: { marginTop: Spacing.huge, alignItems: 'center' },
  versionText: { fontSize: Typography.fontSize.sm },
});
