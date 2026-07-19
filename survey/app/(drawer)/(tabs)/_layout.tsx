import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Colors, Shadows, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, History, User, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 20,
          left: 24,
          right: 24,
          height: 64,
          borderRadius: 28,
          borderTopWidth: 0,
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          paddingBottom: Platform.OS === 'ios' ? 4 : 6,
          paddingTop: 6,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
            },
            android: { elevation: 12 },
          }),
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={75}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarItemStyle: {
          height: '100%',
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: Typography.fontFamily.bold,
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Home size={focused ? 22 : 20} color={focused ? theme.primary : theme.textSecondary} />
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />
      <Tabs.Screen
        name="survey"
        options={{
          title: 'New Survey',
          href: '/(drawer)/survey',
          tabBarIcon: ({ color, focused }) => (
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              <Plus size={24} color="#fff" />
            </LinearGradient>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <History size={focused ? 22 : 20} color={focused ? theme.primary : theme.textSecondary} />
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <User size={focused ? 22 : 20} color={focused ? theme.primary : theme.textSecondary} />
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 6 : 4,
    ...Shadows.md,
  },
});
