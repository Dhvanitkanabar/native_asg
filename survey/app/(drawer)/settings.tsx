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
import * as Notifications from 'expo-notifications';
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
    const targetVal = !(settings as any)[key];

    if (key === 'pushNotifications' && targetVal) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permission',
          'Please enable system notification settings to receive survey alerts.'
        );
        return;
      }
    }

    const updated = { ...settings, [key]: targetVal };
    setSettings(updated);
    try {
      await AsyncStorage.setItem('@app_settings', JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save settings', e);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Log Out', 'Are you sure you want to log out of your profile?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: () => signOut()
      }
    ]);
  };

  const renderToggleRow = (icon: React.ReactNode, title: string, subtitle: string | null, settingKey: string, color: string) => (
    <View style={[styles.row, { borderBottomColor: theme.borderLight }]}>
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

  const renderLinkRow = (icon: React.ReactNode, title: string, color: string, onPress: () => void, isLast = false) => (
    <TouchableOpacity 
      style={[styles.row, !isLast && { borderBottomColor: theme.borderLight }]} 
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader title="Settings" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Notifications</Text>
        <AppCard variant="elevated" style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderToggleRow(
            <Bell size={18} color={theme.primary} />, 
            'Push Notifications', 
            'Receive alerts on your device', 
            'pushNotifications', 
            theme.primary
          )}
          {renderToggleRow(
            <Mail size={18} color={theme.success} />, 
            'Email Summaries', 
            'Weekly operations summaries', 
            'emailNotifications', 
            theme.success
          )}
        </AppCard>

        <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Privacy & Security</Text>
        <AppCard variant="elevated" style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderToggleRow(
            <Fingerprint size={18} color={theme.accent} />, 
            'Biometric Lock', 
            'Lock application using FaceID/TouchID', 
            'faceId', 
            theme.accent
          )}
          {renderToggleRow(
            <MapPin size={18} color={theme.warning} />, 
            'Location Auto-Tag', 
            'Attach coordinates to survey forms', 
            'locationTracking', 
            theme.warning
          )}
          {renderLinkRow(
            <Lock size={18} color={theme.primary} />, 
            'Change Passcode', 
            theme.primary, 
            () => Alert.alert('Passcode Reset', 'Passcode request instructions sent to your email.'),
            true
          )}
        </AppCard>

        <Text style={[styles.sectionTitle, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Support & Info</Text>
        <AppCard variant="elevated" style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderLinkRow(
            <HelpCircle size={18} color={theme.success} />, 
            'Help Center', 
            theme.success, 
            () => Alert.alert('Help Desk', 'Connecting to support services...')
          )}
          {renderLinkRow(
            <FileText size={18} color={theme.textSecondary} />, 
            'Terms of Service', 
            theme.textSecondary, 
            () => Alert.alert('TOS', 'Opening Terms and Disclaimers document...'),
            true
          )}
        </AppCard>

        <Text style={[styles.sectionTitle, { color: theme.danger, fontFamily: Typography.fontFamily.bold }]}>Account Actions</Text>
        <AppCard variant="elevated" style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: Spacing.xl }]}>
          {renderLinkRow(
            <LogOut size={18} color={theme.danger} />, 
            'Log Out Profile', 
            theme.danger, 
            handleLogout,
            true
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
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 11,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  card: { 
    borderRadius: Radius.lg, 
    borderWidth: 1, 
    overflow: 'hidden',
    paddingVertical: 0,
    ...Shadows.md
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.lg, 
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 38, 
    height: 38, 
    borderRadius: Radius.md,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.md,
  },
  rowTextContainer: { flex: 1, paddingRight: Spacing.sm },
  rowTitle: { fontSize: Typography.fontSize.md },
  rowSubtitle: { fontSize: Typography.fontSize.xs - 1, marginTop: 3 },
  versionContainer: { marginTop: Spacing.huge, alignItems: 'center', marginBottom: Spacing.xl },
  versionText: { fontSize: Typography.fontSize.sm, letterSpacing: 0.5 },
});
