import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DrawerLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const BackButton = () => (
    <TouchableOpacity onPress={() => router.push('/(drawer)/(tabs)')} style={{ marginLeft: 15 }}>
      <Ionicons name="arrow-back" size={24} color={theme.text} />
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        screenOptions={{ 
          headerShown: true,
          headerTintColor: theme.text,
          headerStyle: { backgroundColor: theme.surface || '#F8FAFC' },
          drawerActiveTintColor: theme.tint,
          drawerInactiveTintColor: theme.textSecondary || theme.tabIconDefault,
          drawerActiveBackgroundColor: theme.tint + '12',
          drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -8 },
          drawerItemStyle: { borderRadius: 14, paddingVertical: 2, marginHorizontal: 8 },
          drawerStyle: { 
            backgroundColor: theme.surface || '#F8FAFC',
            width: 280,
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="survey"
          options={{
            drawerLabel: 'New Survey',
            title: 'New Survey',
            drawerIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="camera"
          options={{
            drawerLabel: 'Camera',
            title: 'Camera',
            drawerIcon: ({ color }) => <Ionicons name="camera-outline" size={22} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="contacts"
          options={{
            drawerLabel: 'Contacts',
            title: 'Contacts',
            drawerIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="location"
          options={{
            drawerLabel: 'Location',
            title: 'Location',
            drawerIcon: ({ color }) => <Ionicons name="location-outline" size={22} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="clipboard"
          options={{
            drawerLabel: 'Clipboard',
            title: 'Clipboard',
            drawerIcon: ({ color }) => <Ionicons name="clipboard-outline" size={22} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: 'Settings',
            title: 'Settings',
            drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
