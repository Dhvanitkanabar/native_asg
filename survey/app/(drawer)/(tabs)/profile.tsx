import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Image, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  Camera, Briefcase, Mail, FileText, ChevronRight, LogOut, 
  ShieldCheck, Users, HelpCircle, Info, User, Check, X, Menu
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { useFocusEffect, useRouter, useNavigation } from 'expo-router';
import { useSession } from '@/hooks/ctx';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppCard } from '@/components/ui/AppCard';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signOut } = useSession();
  const navigation = useNavigation<any>();

  // State
  const [profile, setProfile] = useState({
    name: 'User',
    role: 'Field Agent',
    email: '',
    photoUri: null,
  });
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalContacts: 0
  });
  
  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  // Load Data
  useFocusEffect(
    useCallback(() => {
      loadProfileAndStats();
    }, [])
  );

  const loadProfileAndStats = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('@user_profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      const surveysData = await AsyncStorage.getItem('@surveys_history');
      const surveysList = surveysData ? JSON.parse(surveysData) : [];
      
      const contactsData = await AsyncStorage.getItem('contactsList');
      const contactsList = contactsData ? JSON.parse(contactsData) : [];
      let totalContactsCount = contactsList.length;

      // Dynamically load contact count if permission is granted
      try {
        const { status } = await Contacts.getPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });
          const deviceContacts = data.filter(c => c.name);
          const customLocal = contactsList.filter((c: any) => String(c.id).startsWith('local-'));
          totalContactsCount = customLocal.length + deviceContacts.length;

          const combinedList = [...customLocal, ...deviceContacts];
          await AsyncStorage.setItem('contactsList', JSON.stringify(combinedList));
        }
      } catch (err) {
        console.log('Error counting device contacts in profile:', err);
      }

      setStats({
        totalSurveys: surveysList.length,
        totalContacts: totalContactsCount
      });
    } catch (e) {
      console.log('Error loading profile/stats', e);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!editForm.name.trim()) {
        Alert.alert('Error', 'Name cannot be empty.');
        return;
      }
      setProfile(editForm);
      await AsyncStorage.setItem('@user_profile', JSON.stringify(editForm));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  const pickImage = async (forEdit = false) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri as any;
      if (forEdit) {
        setEditForm({ ...editForm, photoUri: uri });
      } else {
        const newProfile = { ...profile, photoUri: uri };
        setProfile(newProfile);
        await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const renderMenuItem = (icon: React.ReactNode, title: string, subtitle: string | null, onPress: () => void, isDestructive = false) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: isDestructive ? theme.danger + '12' : theme.primary + '12' }]}>
        {icon}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: isDestructive ? theme.danger : theme.text, fontFamily: Typography.fontFamily.semiBold }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={theme.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      {/* Floating Hamburger Menu */}
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()} 
        style={styles.floatingMenuButton}
        activeOpacity={0.7}
      >
        <Menu size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Curved Header Background Gradient */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        />

        {/* Profile Card */}
        <AppCard variant="elevated" style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage(false)}>
            <AppAvatar 
              photoUri={profile.photoUri} 
              name={profile.name} 
              size={96} 
            />
            <View style={[styles.editAvatarBadge, { backgroundColor: theme.primary, borderColor: theme.surfaceElevated }]}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{profile.name || 'Agent Name'}</Text>
          <Text style={[styles.userRole, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{profile.role || 'Field Inspector'}</Text>
          
          <AppButton 
            title="Edit Profile"
            variant="outline"
            onPress={() => {
              setEditForm({ ...profile });
              setIsEditModalVisible(true);
            }}
            style={styles.editProfileBtn}
          />
        </AppCard>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <AppCard variant="elevated" style={styles.statBox}>
            <View style={[styles.statIconWrapper, { backgroundColor: theme.primary + '12' }]}>
              <FileText size={22} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{stats.totalSurveys}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Surveys</Text>
          </AppCard>
          
          <AppCard variant="elevated" style={styles.statBox}>
            <View style={[styles.statIconWrapper, { backgroundColor: theme.success + '12' }]}>
              <Users size={22} color={theme.success} />
            </View>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{stats.totalContacts}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Contacts</Text>
          </AppCard>
        </View>

        {/* Options Menu Grid */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>Account</Text>
          <AppCard variant="elevated" style={styles.menuCard}>
            {renderMenuItem(
              <User size={18} color={theme.primary} />,
              'Personal Information', 
              profile.email || 'Click to edit details', 
              () => {
                setEditForm({ ...profile });
                setIsEditModalVisible(true);
              }
            )}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            {renderMenuItem(
              <ShieldCheck size={18} color={theme.primary} />,
              'Security & Biometrics', 
              'Manage passcode & face unlock', 
              () => router.push('/(drawer)/settings')
            )}
          </AppCard>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>General</Text>
          <AppCard variant="elevated" style={styles.menuCard}>
            {renderMenuItem(
              <FileText size={18} color={theme.primary} />,
              'Clipboard Manager', 
              'View copied field details', 
              () => router.push('/(drawer)/clipboard')
            )}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            {renderMenuItem(
              <Info size={18} color={theme.primary} />,
              'About App', 
              'Version 1.0.0', 
              () => {}
            )}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            {renderMenuItem(
              <LogOut size={18} color={theme.danger} />,
              'Log Out', 
              null, 
              handleLogout, 
              true
            )}
          </AppCard>
        </View>
      </ScrollView>

      {/* ====== Edit Profile Modal ====== */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={[styles.modalCancelBtn, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={[styles.modalSaveBtn, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Selection */}
            <View style={styles.modalAvatarSection}>
              <TouchableOpacity style={styles.modalAvatarWrapper} onPress={() => pickImage(true)}>
                <AppAvatar 
                  photoUri={editForm.photoUri} 
                  name={editForm.name} 
                  size={110} 
                />
                <View style={[styles.modalEditBadge, { backgroundColor: theme.primary, borderColor: theme.surfaceElevated }]}>
                  <Camera size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.modalAvatarHint, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Change Photo</Text>
            </View>

            <AppInput
              label="Full Name"
              placeholder="Enter your name"
              value={editForm.name}
              onChangeText={(val) => setEditForm({...editForm, name: val})}
              icon={<User size={18} color={theme.textTertiary} />}
            />

            <AppInput
              label="Role / Title"
              placeholder="Enter your role"
              value={editForm.role}
              onChangeText={(val) => setEditForm({...editForm, role: val})}
              icon={<Briefcase size={18} color={theme.textTertiary} />}
            />

            <AppInput
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={editForm.email}
              onChangeText={(val) => setEditForm({...editForm, email: val})}
              icon={<Mail size={18} color={theme.textTertiary} />}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingMenuButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  profileCard: {
    marginTop: 70,
    marginHorizontal: Spacing.xl,
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 0,
  },
  avatarContainer: {
    marginTop: -70,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  userName: { fontSize: Typography.fontSize.xxl, marginBottom: Spacing.xs },
  userRole: { fontSize: Typography.fontSize.sm, marginBottom: Spacing.lg },
  editProfileBtn: { height: 42, paddingHorizontal: Spacing.xl, borderRadius: Radius.full },

  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, gap: Spacing.md },
  statBox: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 0 },
  statIconWrapper: {
    width: 44, height: 44, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  statValue: { fontSize: Typography.fontSize.xxl, marginBottom: 2 },
  statLabel: { fontSize: Typography.fontSize.xs },

  // Options Menu
  menuSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: Typography.fontSize.xs, marginBottom: Spacing.sm, marginLeft: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuCard: { paddingVertical: Spacing.xs, borderRadius: Radius.md, borderWidth: 0, marginBottom: Spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  menuIconContainer: { width: 36, height: 36, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: Typography.fontSize.md },
  menuSubtitle: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  divider: { height: 1, marginLeft: 66 },
  
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1.5,
  },
  modalCancelBtn: { fontSize: Typography.fontSize.md },
  modalTitle: { fontSize: Typography.fontSize.md + 1 },
  modalSaveBtn: { fontSize: Typography.fontSize.md },
  modalContent: { padding: Spacing.xl },
  modalAvatarSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  modalAvatarWrapper: { position: 'relative' },
  modalEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 32, height: 32, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3,
  },
  modalAvatarHint: { marginTop: Spacing.sm, fontSize: Typography.fontSize.sm },
});
