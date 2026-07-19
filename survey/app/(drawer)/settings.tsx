import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Switch, 
  TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSession } from '@/hooks/ctx';

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

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await AsyncStorage.setItem('@app_settings', JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save settings', e);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: () => signOut()
      }
    ]);
  };

  const renderToggleRow = (icon, title, subtitle, settingKey, color) => (
    <View style={styles.row}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: '#D1D5DB', true: theme.tint }}
        thumbColor={'#fff'}
      />
    </View>
  );

  const renderLinkRow = (icon, title, color, onPress) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F3F4F6' }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          {renderToggleRow('notifications-outline', 'Push Notifications', 'Receive alerts on your phone', 'pushNotifications', '#3B82F6')}
          <View style={styles.divider} />
          {renderToggleRow('mail-outline', 'Email Summaries', 'Weekly survey reports', 'emailNotifications', '#8B5CF6')}
        </View>

        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          {renderToggleRow('scan-outline', 'FaceID / Biometrics', 'Require scan to open app', 'faceId', '#10B981')}
          <View style={styles.divider} />
          {renderToggleRow('location-outline', 'Location Tracking', 'Auto-attach GPS to surveys', 'locationTracking', '#F59E0B')}
          <View style={styles.divider} />
          {renderLinkRow('lock-closed-outline', 'Change Password', '#6366F1', () => Alert.alert('Change Password', 'A password reset link would be sent to your email.'))}
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          {renderLinkRow('help-circle-outline', 'Help Center', '#14B8A6', () => Alert.alert('Help', 'Opening help center...'))}
          <View style={styles.divider} />
          {renderLinkRow('document-text-outline', 'Terms of Service', '#6B7280', () => Alert.alert('TOS', 'Opening Terms of Service...'))}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          {renderLinkRow('log-out-outline', 'Log Out', '#EF4444', handleLogout)}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Survey App v1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 66,
  },
  versionContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  }
});
