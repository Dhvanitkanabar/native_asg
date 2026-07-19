import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter, useSegments } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  Home, FileText, Camera, Users, MapPin, Clipboard, Settings, 
  LogOut, ArrowLeft 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { useSession } from '@/hooks/ctx';
import * as Haptics from 'expo-haptics';

function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { signOut } = useSession();
  const [profile, setProfile] = useState({ name: 'User', role: 'Field Inspector', photoUri: null });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_profile');
        if (stored) {
          setProfile(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load profile in drawer', e);
      }
    };
    loadProfile();
  }, [props]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Premium Drawer Header Banner */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drawerHeader}
        >
          <View style={styles.headerAvatarWrapper}>
            <AppAvatar 
              photoUri={profile.photoUri} 
              name={profile.name} 
              size={56} 
            />
          </View>
          <Text style={[styles.userName, { fontFamily: Typography.fontFamily.black }]} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={[styles.userRole, { fontFamily: Typography.fontFamily.medium }]}>
            {profile.role}
          </Text>
        </LinearGradient>

        <View style={styles.itemListContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Drawer Footer LogOut */}
      <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[styles.logoutIconWrapper, { backgroundColor: theme.danger + '12' }]}>
            <LogOut size={18} color={theme.danger} />
          </View>
          <Text style={[styles.logoutText, { color: theme.danger, fontFamily: Typography.fontFamily.bold }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ 
          headerShown: false, // Hides native drawer headers everywhere!
          drawerActiveTintColor: theme.primary,
          drawerInactiveTintColor: theme.textSecondary,
          drawerActiveBackgroundColor: theme.primary + '12',
          drawerLabelStyle: { fontSize: 14, fontFamily: Typography.fontFamily.bold, marginLeft: -10 },
          drawerItemStyle: { borderRadius: Radius.md, paddingVertical: Spacing.xs - 2, marginHorizontal: Spacing.sm },
          drawerStyle: { 
            backgroundColor: theme.surface,
            width: 280,
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: ({ color }) => <Home size={20} color={color} />,
          }}
        />
        <Drawer.Screen
          name="survey"
          options={{
            drawerLabel: 'New Survey',
            title: 'New Survey',
            drawerIcon: ({ color }) => <FileText size={20} color={color} />,
          }}
        />
        <Drawer.Screen
          name="camera"
          options={{
            drawerLabel: 'Camera',
            title: 'Camera',
            drawerIcon: ({ color }) => <Camera size={20} color={color} />,
          }}
        />
        <Drawer.Screen
          name="contacts"
          options={{
            drawerLabel: 'Contacts',
            title: 'Contacts',
            drawerIcon: ({ color }) => <Users size={20} color={color} />,
          }}
        />
        <Drawer.Screen
          name="location"
          options={{
            drawerLabel: 'Location',
            title: 'Location',
            drawerIcon: ({ color }) => <MapPin size={20} color={color} />,
          }}
        />
        <Drawer.Screen
          name="clipboard"
          options={{
            drawerLabel: 'Clipboard',
            title: 'Clipboard',
            drawerIcon: ({ color }) => <Clipboard size={20} color={color} />,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: 'Settings',
            title: 'Settings',
            drawerIcon: ({ color }) => <Settings size={20} color={color} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  headerAvatarWrapper: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: Spacing.sm,
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userName: {
    color: '#fff',
    fontSize: Typography.fontSize.lg,
    letterSpacing: -0.3,
  },
  userRole: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  itemListContainer: {
    paddingTop: Spacing.xs,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  logoutText: {
    fontSize: Typography.fontSize.md - 1,
  },
});
