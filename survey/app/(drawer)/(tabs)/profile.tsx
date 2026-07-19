import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Image, Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSession } from '@/hooks/ctx';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signOut } = useSession();

  // State
  const [profile, setProfile] = useState({
    name: '',
    role: '',
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
      // Load Profile
      const storedProfile = await AsyncStorage.getItem('@user_profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }

      // Load Stats
      const surveysData = await AsyncStorage.getItem('@surveys_history');
      const surveysList = surveysData ? JSON.parse(surveysData) : [];
      
      const contactsData = await AsyncStorage.getItem('contactsList');
      const contactsList = contactsData ? JSON.parse(contactsData) : [];

      setStats({
        totalSurveys: surveysList.length,
        totalContacts: contactsList.length
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
      const uri = result.assets[0].uri;
      if (forEdit) {
        setEditForm({ ...editForm, photoUri: uri });
      } else {
        const newProfile = { ...profile, photoUri: uri };
        setProfile(newProfile);
        await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));
      }
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

  const renderMenuItem = (icon, title, subtitle, onPress, isDestructive = false) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: isDestructive ? '#FEE2E2' : theme.tint + '15' }]}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#EF4444' : theme.tint} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: isDestructive ? '#EF4444' : theme.text }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F3F4F6' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Background */}
        <View style={[styles.headerBackground, { backgroundColor: theme.tint }]} />

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.background }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage(false)}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + '20' }]}>
                <Text style={[styles.avatarInitials, { color: theme.tint }]}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <View style={[styles.editAvatarBadge, { backgroundColor: theme.tint }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: theme.text }]}>{profile.name}</Text>
          <Text style={styles.userRole}>{profile.role}</Text>
          
          <TouchableOpacity 
            style={[styles.editProfileBtn, { borderColor: theme.tint }]}
            onPress={() => {
              setEditForm({ ...profile });
              setIsEditModalVisible(true);
            }}
          >
            <Text style={[styles.editProfileText, { color: theme.tint }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.background }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="document-text" size={24} color="#0284C7" />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalSurveys}</Text>
            <Text style={styles.statLabel}>Surveys</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: theme.background }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="people" size={24} color="#16A34A" />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalContacts}</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={[styles.menuCard, { backgroundColor: theme.background }]}>
            {renderMenuItem('person-circle-outline', 'Personal Information', profile.email, () => {
              setEditForm({ ...profile });
              setIsEditModalVisible(true);
            })}
            <View style={styles.divider} />
            {renderMenuItem('notifications-outline', 'Notifications', 'On', () => router.push('/(drawer)/settings'))}
            <View style={styles.divider} />
            {renderMenuItem('shield-checkmark-outline', 'Security', 'Password, FaceID', () => router.push('/(drawer)/settings'))}
          </View>

          <Text style={styles.sectionTitle}>General</Text>
          <View style={[styles.menuCard, { backgroundColor: theme.background }]}>
            {renderMenuItem('clipboard-outline', 'Clipboard Manager', 'View saved items', () => router.push('/(drawer)/clipboard'))}
            <View style={styles.divider} />
            {renderMenuItem('information-circle-outline', 'About App', 'Version 1.0.0', () => {})}
            <View style={styles.divider} />
            {renderMenuItem('log-out-outline', 'Log Out', null, handleLogout, true)}
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={[styles.modalSaveBtn, { color: theme.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalAvatarSection}>
              <TouchableOpacity style={styles.modalAvatarWrapper} onPress={() => pickImage(true)}>
                {editForm.photoUri ? (
                  <Image source={{ uri: editForm.photoUri }} style={styles.modalAvatar} />
                ) : (
                  <View style={[styles.modalAvatarPlaceholder, { backgroundColor: theme.tint + '20' }]}>
                    <Text style={[styles.modalAvatarInitials, { color: theme.tint }]}>
                      {editForm.name ? editForm.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.modalEditBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.modalAvatarHint, { color: theme.tint }]}>Change Photo</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={editForm.name}
                  onChangeText={(val) => setEditForm({...editForm, name: val})}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role / Title</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="briefcase-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={editForm.role}
                  onChangeText={(val) => setEditForm({...editForm, role: val})}
                  placeholder="Enter your role"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={editForm.email}
                  onChangeText={(val) => setEditForm({...editForm, email: val})}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileCard: {
    marginTop: 80,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarContainer: {
    marginTop: -60, // overlaps the header background
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '800',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 20,
  },
  editProfileBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  editProfileText: {
    fontWeight: '700',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  menuSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 76,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalCancelBtn: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSaveBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalContent: {
    padding: 24,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalAvatarWrapper: {
    position: 'relative',
  },
  modalAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarInitials: {
    fontSize: 48,
    fontWeight: '800',
  },
  modalEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  modalAvatarHint: {
    marginTop: 12,
    fontWeight: '600',
    fontSize: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  }
});
