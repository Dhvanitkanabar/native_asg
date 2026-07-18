import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function DrawerLayout() {
  const router = useRouter();
  
  const BackButton = () => (
    <TouchableOpacity onPress={() => router.push('/(drawer)/(tabs)')} style={{ marginLeft: 15 }}>
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{ headerShown: true }}>
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          }}
        />
        <Drawer.Screen
          name="survey"
          options={{
            drawerLabel: 'Survey',
            title: 'Survey',
            drawerIcon: ({ color }) => <Ionicons name="document-text-outline" size={24} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />

        <Drawer.Screen
          name="camera"
          options={{
            drawerLabel: 'Camera',
            title: 'Camera',
            drawerIcon: ({ color }) => <Ionicons name="camera-outline" size={24} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="contacts"
          options={{
            drawerLabel: 'Contacts',
            title: 'Contacts',
            drawerIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="location"
          options={{
            drawerLabel: 'Location',
            title: 'Location',
            drawerIcon: ({ color }) => <Ionicons name="location-outline" size={24} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="clipboard"
          options={{
            drawerLabel: 'Clipboard',
            title: 'Clipboard',
            drawerIcon: ({ color }) => <Ionicons name="clipboard-outline" size={24} color={color} />,
            headerLeft: () => <BackButton />,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: 'Settings',
            title: 'Settings',
            drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
