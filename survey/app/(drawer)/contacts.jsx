import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Linking,
  Platform,
  Share
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from "expo-contacts";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from "react-native-gesture-handler";
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';
import { 
  Users, User, Plus, Search, Mail, Phone, Trash2, Star, 
  X, ChevronRight, Copy, MessageSquare, ExternalLink, RefreshCw, Menu
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigation } from 'expo-router';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import * as Haptics from 'expo-haptics';

const TAGS = ["All", "Work", "Family", "Friends", "Other"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
const ITEM_HEIGHT = 74;
const HEADER_HEIGHT = 36;

const ContactScreen = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation();

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  
  const [activeFilterTag, setActiveFilterTag] = useState("All");
  const [contactTags, setContactTags] = useState({}); 
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const sectionListRef = useRef(null);

  const [contactForm, setContactForm] = useState({ name: "", phones: [""], email: "", tag: "Other" });
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]); 

  const isFirstRender = useRef(true);

  const getContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      // Load local contacts cache first
      const stored = await AsyncStorage.getItem('contactsList');
      let localContacts = stored ? JSON.parse(stored) : [];

      if (status !== "granted") {
        setContacts(localContacts);
        setFilteredContacts(localContacts);
        setRefreshing(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image, Contacts.Fields.Emails],
      });

      const deviceContacts = data.filter(c => c.name);
      
      // Merge manually created contacts (starting with local-) and device contacts
      const customLocal = localContacts.filter(c => String(c.id).startsWith('local-'));
      const combined = [...customLocal, ...deviceContacts];
      
      combined.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setContacts(combined);
      setFilteredContacts(combined);
    } catch (e) {
      console.log('Error loading contacts:', e);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    getContacts();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    AsyncStorage.setItem('contactsList', JSON.stringify(contacts))
      .catch(err => console.log('Error saving contacts list:', err));
  }, [contacts]);

  useEffect(() => {
    let result = contacts;
    if (search.trim() !== "") {
      result = result.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));
    }
    if (activeFilterTag !== "All") {
      result = result.filter((c) => contactTags[c.id] === activeFilterTag);
    }
    setFilteredContacts(result);
  }, [search, activeFilterTag, contacts, contactTags]);

  const onRefresh = () => { setRefreshing(true); getContacts(); };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return Alert.alert("Error", "Name cannot be empty.");
    const validPhones = contactForm.phones.map(p => p.trim()).filter(p => p !== "");

    try {
      const contact = {
        [Contacts.Fields.FirstName]: contactForm.name,
        contactType: Contacts.ContactTypes.Person,
      };

      if (validPhones.length > 0) {
        contact[Contacts.Fields.PhoneNumbers] = validPhones.map(phone => ({ label: "mobile", number: phone }));
      }
      
      if (contactForm.email.trim()) {
        contact[Contacts.Fields.Emails] = [{ label: "work", email: contactForm.email.trim() }];
      }

      let savedId = editingContactId;
      if (editingContactId) {
        // Edit existing contact logic
        setContacts(prev => prev.map((c) => c.id === editingContactId ? { ...c, name: contactForm.name, phoneNumbers: validPhones.map(p => ({ number: p })), emails: contactForm.email ? [{ email: contactForm.email }] : [] } : c));
        Alert.alert("Success", "Contact updated successfully!");
      } else {
        // Add new contact logic
        const newId = `local-${Date.now()}`;
        savedId = newId;
        const newContactObj = {
          id: newId,
          name: contactForm.name,
          phoneNumbers: validPhones.map(p => ({ number: p })),
          emails: contactForm.email ? [{ email: contactForm.email }] : []
        };
        setContacts(prev => [newContactObj, ...prev]);
        Alert.alert("Success", "Contact added successfully!");
      }

      setContactTags((prev) => ({ ...prev, [savedId]: contactForm.tag }));
      setModalVisible(false);
      setEditingContactId(null);
      setContactForm({ name: "", phones: [""], email: "", tag: "Other" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Failed to save contact.");
    }
  };

  const deleteContact = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        setContacts(prev => prev.filter((c) => c.id !== id));
        if (selectedProfile?.id === id) setProfileModalVisible(false);
      }}
    ]);
  };

  const toggleFavorite = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const shareContact = async (contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const num = contact.phoneNumbers?.[0]?.number || "No number";
      await Share.share({
        message: `Contact: ${contact.name}\nPhone: ${num}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share contact.");
    }
  };

  const copyToClipboard = async (text) => {
    if (text) {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied", "Copied to clipboard!");
    }
  };

  // Group contacts by alphabet
  const sections = useMemo(() => {
    const map = {};
    filteredContacts.forEach((c) => {
      const firstChar = c.name?.charAt(0).toUpperCase() || "#";
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });

    return Object.keys(map)
      .sort((a, b) => {
        if (a === "#") return 1;
        if (b === "#") return -1;
        return a.localeCompare(b);
      })
      .map(key => ({ title: key, data: map[key] }));
  }, [filteredContacts]);

  const getInitials = (n) => {
    if (!n) return "";
    const parts = n.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return n.charAt(0).toUpperCase();
  };

  const scrollToIndex = (letter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sectionIndex = sections.findIndex(s => s.title === letter);
    if (sectionIndex !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        viewPosition: 0,
        animated: true
      });
    }
  };

  const getItemLayout = sectionListGetItemLayout({
    getItemHeight: () => ITEM_HEIGHT,
    getSectionHeaderHeight: () => HEADER_HEIGHT,
  });

  const renderSwipeableItem = (item) => {
    const num = item.phoneNumbers?.[0]?.number;
    const initialName = getInitials(item.name);
    const tag = contactTags[item.id] || "Other";

    return (
      <View style={[styles.cardWrapper, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={[styles.card, { borderBottomColor: theme.borderLight }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedProfile(item);
            setProfileModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.imageAvailable && item.image?.uri ? (
              <Image source={{ uri: item.image.uri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: favorites.includes(item.id) ? theme.warning + '20' : theme.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: favorites.includes(item.id) ? theme.warning : theme.primary, fontFamily: Typography.fontFamily.bold }]}>{initialName}</Text>
              </View>
            )}
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.name, { color: theme.text, fontFamily: Typography.fontFamily.bold }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.subInfoRow}>
              {num ? (
                <Text style={[styles.number, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]} numberOfLines={1}>{num}</Text>
              ) : (
                <View style={[styles.noNumberBadge, { backgroundColor: theme.danger + '14' }]}>
                  <Phone size={10} color={theme.danger} />
                  <Text style={[styles.noNumberText, { color: theme.danger, fontFamily: Typography.fontFamily.bold }]}>No Number</Text>
                </View>
              )}
              {tag !== "Other" && (
                <View style={[styles.smallTag, { backgroundColor: theme.primary + '12' }]}>
                  <Text style={[styles.smallTagText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>{tag}</Text>
                </View>
              )}
            </View>
          </View>
          {favorites.includes(item.id) && (
            <Star size={16} color={theme.warning} fill={theme.warning} style={{ marginRight: Spacing.md }} />
          )}
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={[styles.menuBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Menu size={20} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.heading, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>Contacts</Text>
            <Text style={[styles.counterText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{contacts.length} total entries</Text>
          </View>
        </View>
        <AppButton 
          title="Add" 
          onPress={() => {
            setEditingContactId(null);
            setContactForm({ name: "", phones: [""], email: "", tag: "Other" });
            setModalVisible(true);
          }} 
          style={styles.addBtn}
          icon={<Plus size={16} color="#fff" />}
        />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1.5 }]}>
          <Search size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}
            placeholder="Search contact name..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Tag Filters */}
      <View style={styles.tagFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TAGS.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tagFilterChip,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
                activeFilterTag === t && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilterTag(t);
              }}
            >
              <Text style={[
                styles.tagFilterText,
                { fontFamily: Typography.fontFamily.bold },
                activeFilterTag === t ? { color: '#fff' } : { color: theme.textSecondary }
              ]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contact Section List */}
      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          renderItem={({ item }) => renderSwipeableItem(item)}
          getItemLayout={getItemLayout}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeaderContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionHeader, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>{title}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBg, { backgroundColor: theme.primary + '10' }]}>
                <Users size={52} color={theme.primary + '80'} />
              </View>
              <Text style={[styles.emptyStateText, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>No Contacts Found</Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
                {search ? `No results for "${search}"` : 'Grant permission or add contacts manually.'}
              </Text>
              {!search && (
                <TouchableOpacity 
                  onPress={() => { setContactForm({ name: "", phones: [""], email: "", tag: "Other" }); setModalVisible(true); }}
                  style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={[styles.emptyAddBtnText, { fontFamily: Typography.fontFamily.bold }]}>Add First Contact</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Alphabet Sidebar */}
        {filteredContacts.length > 5 && (
          <View style={styles.alphabetIndexWrapper}>
            <ScrollView contentContainerStyle={styles.alphabetIndex} showsVerticalScrollIndicator={false}>
              {ALPHABET.map((char) => (
                <TouchableOpacity key={char} onPress={() => scrollToIndex(char)}>
                  <Text style={[styles.alphabetText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>{char}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ====== Add/Edit Form Modal ====== */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <AppCard variant="glass" style={styles.modalContent}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>
                {editingContactId ? "Edit Contact" : "New Contact"}
              </Text>
              
              <AppInput
                label="Full Name"
                placeholder="John Doe"
                value={contactForm.name}
                onChangeText={text => setContactForm({ ...contactForm, name: text })}
              />

              <AppInput
                label="Email Address"
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={contactForm.email}
                onChangeText={text => setContactForm({ ...contactForm, email: text })}
              />

              <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Phone Number</Text>
              {contactForm.phones.map((phone, index) => (
                <View key={index} style={styles.phoneRow}>
                  <AppInput
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={text => {
                      const updated = [...contactForm.phones];
                      updated[index] = text;
                      setContactForm({ ...contactForm, phones: updated });
                    }}
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                  />
                  {contactForm.phones.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removePhoneBtn} 
                      onPress={() => {
                        const updated = contactForm.phones.filter((_, i) => i !== index);
                        setContactForm({ ...contactForm, phones: updated });
                      }}
                    >
                      <Trash2 size={16} color={theme.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity 
                style={[styles.addPhoneBtn, { backgroundColor: theme.primary + '08' }]}
                onPress={() => setContactForm({ ...contactForm, phones: [...contactForm.phones, ""] })}
              >
                <Text style={[styles.addPhoneText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>+ Add Phone Field</Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.bold, marginTop: Spacing.lg }]}>Tag Category</Text>
              <View style={styles.tagSelector}>
                {TAGS.slice(1).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagBtn,
                      { backgroundColor: theme.surface },
                      contactForm.tag === tag && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setContactForm({ ...contactForm, tag })}
                  >
                    <Text style={[
                      styles.tagBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                      contactForm.tag === tag ? { color: '#fff' } : { color: theme.textSecondary }
                    ]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <AppButton 
                title="Cancel" 
                variant="outline" 
                onPress={() => setModalVisible(false)} 
                style={{ flex: 1 }}
              />
              <AppButton 
                title="Save" 
                onPress={handleSaveContact} 
                style={{ flex: 1 }}
              />
            </View>
          </AppCard>
        </View>
      </Modal>

      {/* ====== Contact Info Card Modal ====== */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.profileModalContainer}>
          <View style={[styles.profileModalContent, { backgroundColor: theme.background }]}>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={[styles.closeProfileBtn, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>

            {selectedProfile && (
              <>
                <View style={styles.profileAvatarWrapper}>
                  {selectedProfile.imageAvailable && selectedProfile.image?.uri ? (
                    <Image source={{ uri: selectedProfile.image.uri }} style={styles.profileAvatar} />
                  ) : (
                    <View style={[styles.profileAvatarPlaceholder, { backgroundColor: favorites.includes(selectedProfile.id) ? theme.warning : theme.primary }]}>
                      <Text style={[styles.profileAvatarText, { fontFamily: Typography.fontFamily.black }]}>{getInitials(selectedProfile.name)}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.profileName, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{selectedProfile.name}</Text>
                <View style={[styles.profileTagPill, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.profileTagText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>{contactTags[selectedProfile.id] || "No Category"}</Text>
                </View>

                {/* Actions Grid */}
                <View style={styles.profileActionRow}>
                  <TouchableOpacity style={[styles.profileActionBtn, { backgroundColor: theme.surfaceElevated }]} onPress={() => Linking.openURL(`tel:${selectedProfile.phoneNumbers?.[0]?.number}`)}>
                    <Phone size={18} color={theme.primary} />
                    <Text style={[styles.profileActionLabel, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.profileActionBtn, { backgroundColor: theme.surfaceElevated }]} onPress={() => Linking.openURL(`sms:${selectedProfile.phoneNumbers?.[0]?.number}`)}>
                    <MessageSquare size={18} color={theme.success} />
                    <Text style={[styles.profileActionLabel, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Text</Text>
                  </TouchableOpacity>
                  {selectedProfile.emails?.[0]?.email && (
                    <TouchableOpacity style={[styles.profileActionBtn, { backgroundColor: theme.surfaceElevated }]} onPress={() => Linking.openURL(`mailto:${selectedProfile.emails[0].email}`)}>
                      <Mail size={18} color={theme.accent} />
                      <Text style={[styles.profileActionLabel, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Email</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.profileActionBtn, { backgroundColor: theme.surfaceElevated }]} onPress={() => toggleFavorite(selectedProfile.id)}>
                    <Star size={18} color={theme.warning} fill={favorites.includes(selectedProfile.id) ? theme.warning : "transparent"} />
                    <Text style={[styles.profileActionLabel, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Star</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.profileDetailsScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.profileSectionTitle, { color: theme.textTertiary, fontFamily: Typography.fontFamily.bold }]}>Phone Numbers</Text>
                  {selectedProfile.phoneNumbers?.map((p, i) => (
                    <TouchableOpacity key={i} onPress={() => copyToClipboard(p.number)} style={styles.profileDetailRow}>
                      <Text style={[styles.profileDetailText, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}>
                        {p.label ? `${p.label}: ` : ""}{p.number}
                      </Text>
                      <Copy size={14} color={theme.textTertiary} />
                    </TouchableOpacity>
                  ))}
                  {(!selectedProfile.phoneNumbers || selectedProfile.phoneNumbers.length === 0) && (
                    <Text style={[styles.profileDetailText, { fontStyle: 'italic', color: theme.textTertiary, fontFamily: Typography.fontFamily.medium }]}>No Numbers Linked</Text>
                  )}
                  
                  {selectedProfile.emails && selectedProfile.emails.length > 0 && (
                    <>
                      <Text style={[styles.profileSectionTitle, { color: theme.textTertiary, fontFamily: Typography.fontFamily.bold }]}>Emails</Text>
                      {selectedProfile.emails.map((e, i) => (
                        <Text key={i} style={[styles.profileDetailText, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}>{e.email}</Text>
                      ))}
                    </>
                  )}
                  
                  <View style={{ height: Spacing.lg }} />
                  <AppButton 
                    title="Delete Contact" 
                    variant="danger" 
                    onPress={() => deleteContact(selectedProfile.id)} 
                  />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  heading: { fontSize: Typography.fontSize.xxl, letterSpacing: -0.5 },
  counterText: { fontSize: Typography.fontSize.xs + 1, marginTop: 2 },
  addBtn: { height: 40, paddingHorizontal: Spacing.lg, borderRadius: Radius.full },
  
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.md },
  
  tagFiltersContainer: { paddingHorizontal: Spacing.lg, maxHeight: 44, marginBottom: Spacing.sm },
  tagFilterChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginRight: Spacing.sm, alignSelf: 'flex-start' },
  tagFilterText: { fontSize: Typography.fontSize.xs + 1 },
  
  listContainer: { flex: 1 },
  sectionHeaderContainer: { height: HEADER_HEIGHT, justifyContent: "center", paddingHorizontal: Spacing.lg, borderBottomWidth: 1 },
  sectionHeader: { fontSize: Typography.fontSize.xs },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: Spacing.md, paddingHorizontal: Spacing.xxl },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { fontSize: Typography.fontSize.lg },
  emptyStateSub: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full, marginTop: Spacing.sm },
  emptyAddBtnText: { color: '#fff', fontSize: Typography.fontSize.sm },
  noNumberBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.xs },
  noNumberText: { fontSize: 10 },
  menuBtn: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md, borderWidth: 1 },

  cardWrapper: { height: ITEM_HEIGHT },
  card: { height: ITEM_HEIGHT, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, borderBottomWidth: 1 },
  avatarContainer: { marginRight: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16 },
  contactInfo: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, marginBottom: 2 },
  subInfoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  number: { fontSize: Typography.fontSize.sm },
  smallTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.xs },
  smallTagText: { fontSize: 9, textTransform: "uppercase" },

  alphabetIndexWrapper: { position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center", paddingRight: 4 },
  alphabetIndex: { alignItems: "center" },
  alphabetText: { fontSize: 9, marginVertical: 2, paddingHorizontal: 4 },

  // Add modal
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(15,23,42,0.6)" },
  modalContent: { width: "90%", maxHeight: "85%", padding: Spacing.xl, borderRadius: Radius.xl },
  modalScroll: { marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xxl, marginBottom: Spacing.lg, textAlign: "center" },
  label: { fontSize: Typography.fontSize.xs, marginBottom: Spacing.xs, textTransform: "uppercase", letterSpacing: 0.5 },
  tagSelector: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tagBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  phoneRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, gap: Spacing.sm },
  removePhoneBtn: { backgroundColor: '#FEE2E2', width: 44, height: 44, borderRadius: Radius.sm, justifyContent: "center", alignItems: "center" },
  addPhoneBtn: { paddingVertical: Spacing.md, borderRadius: Radius.sm, alignItems: "center" },
  addPhoneText: { fontSize: Typography.fontSize.sm },
  modalButtons: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },

  // Profile Sheet modal
  profileModalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.6)" },
  profileModalContent: { height: "85%", borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, alignItems: "center" },
  closeProfileBtn: { position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  profileAvatarWrapper: { marginBottom: Spacing.md, marginTop: Spacing.md },
  profileAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: "#fff" },
  profileAvatarPlaceholder: { width: 110, height: 110, borderRadius: 55, justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#fff" },
  profileAvatarText: { color: "#fff", fontSize: 40 },
  profileName: { fontSize: Typography.fontSize.xxl, marginBottom: Spacing.xs, textAlign: "center", letterSpacing: -0.5 },
  profileTagPill: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginBottom: Spacing.xl },
  profileTagText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  profileActionRow: { flexDirection: "row", justifyContent: "center", gap: Spacing.md, marginBottom: Spacing.xl, width: "100%" },
  profileActionBtn: { width: 68, height: 68, borderRadius: 34, justifyContent: "center", alignItems: "center", gap: Spacing.xs, ...Shadows.sm },
  profileActionLabel: { fontSize: 10, marginTop: 2 },
  profileDetailsScroll: { width: "100%", flex: 1 },
  profileSectionTitle: { fontSize: Typography.fontSize.xs, marginTop: Spacing.md, marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 1 },
  profileDetailText: { fontSize: Typography.fontSize.md, flex: 1 },
  profileDetailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
});

export default ContactScreen;
