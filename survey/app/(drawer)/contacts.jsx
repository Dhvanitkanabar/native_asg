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
import * as Contacts from "expo-contacts";
import * as Clipboard from "expo-clipboard";
import { Swipeable } from "react-native-gesture-handler";
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const TAGS = ["All", "Work", "Family", "Friends", "Other"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
const ITEM_HEIGHT = 68;
const HEADER_HEIGHT = 32;

const ContactScreen = () => {
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

  const getContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow contacts permission.");
      setRefreshing(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image, Contacts.Fields.Emails],
    });

    // Modified to not filter out those without phones, to show 'No Number' as requested
    const allContacts = data.filter(c => c.name);
    allContacts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setContacts(allContacts);
    setFilteredContacts(allContacts);
    setRefreshing(false);
  };

  useEffect(() => { getContacts(); }, []);

  useEffect(() => {
    let result = contacts;
    if (search.trim() !== "") {
      result = result.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
    }
    if (activeFilterTag !== "All") {
      result = result.filter(c => contactTags[c.id] === activeFilterTag);
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
        contact.id = editingContactId;
        await Contacts.updateContactAsync(contact);
      } else {
        savedId = await Contacts.addContactAsync(contact);
      }

      if (savedId) setContactTags(prev => ({ ...prev, [savedId]: contactForm.tag }));

      setModalVisible(false);
      setContactForm({ name: "", phones: [""], email: "", tag: "Other" });
      setEditingContactId(null);
      getContacts();
    } catch (error) { Alert.alert("Error", "Failed to save contact."); }
  };

  const confirmDeleteContact = (id) => {
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteContact(id) }
    ]);
  };

  const handleDeleteContact = async (id) => {
    try {
      await Contacts.removeContactAsync(id);
      setFavorites(favorites.filter(favId => favId !== id));
      getContacts();
    } catch (error) { Alert.alert("Error", "Failed to delete contact."); }
  };

  const openEditModal = (contact) => {
    const phones = contact.phoneNumbers?.map(p => p.number) || [""];
    setContactForm({
      name: contact.name || "",
      phones: phones.length > 0 ? phones : [""],
      email: contact.emails?.[0]?.email || "",
      tag: contactTags[contact.id] || "Other",
    });
    setEditingContactId(contact.id);
    setModalVisible(true);
  };

  const scrollToSection = (letter) => {
    let index = sections.findIndex(s => s.title === letter);
    if (index === -1) {
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].title.length === 1 && sections[i].title > letter) { index = i; break; }
      }
    }
    if (index === -1 && sections.length > 0) index = sections.length - 1;

    if (index !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({ sectionIndex: index, itemIndex: 0, animated: true });
    }
  };

  const updatePhone = (text, index) => {
    const newPhones = [...contactForm.phones];
    newPhones[index] = text;
    setContactForm({ ...contactForm, phones: newPhones });
  };
  const addPhoneField = () => setContactForm({ ...contactForm, phones: [...contactForm.phones, ""] });
  const removePhoneField = (index) => {
    const newPhones = contactForm.phones.filter((_, i) => i !== index);
    setContactForm({ ...contactForm, phones: newPhones.length > 0 ? newPhones : [""] });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) setFavorites(favorites.filter(favId => favId !== id));
    else setFavorites([...favorites, id]);
  };

  const copyToClipboard = async (text) => {
    if (!text || text === "No Number") return;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied! 📋", "Number copied to clipboard");
  };

  const shareContact = async (contact) => {
    const phone = contact.phoneNumbers?.[0]?.number || "No number";
    const email = contact.emails?.[0]?.email || "No email";
    try {
      await Share.share({
        message: `Contact Info\nName: ${contact.name}\nPhone: ${phone}\nEmail: ${email}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share contact");
    }
  };

  const sections = useMemo(() => {
    const sectionsArr = [];
    const favs = filteredContacts.filter(c => favorites.includes(c.id));
    if (favs.length > 0) sectionsArr.push({ title: '⭐ Favorites', data: favs });
    
    const nonFavs = filteredContacts.filter(c => !favorites.includes(c.id));
    const grouped = nonFavs.reduce((acc, contact) => {
      const firstLetter = (contact.name || "?")[0].toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : "#";
      if (!acc[key]) acc[key] = [];
      acc[key].push(contact);
      return acc;
    }, {});
    
    Object.keys(grouped).sort().forEach(key => sectionsArr.push({ title: key, data: grouped[key] }));
    return sectionsArr;
  }, [filteredContacts, favorites]);

  const getItemLayout = sectionListGetItemLayout({
    getItemHeight: () => ITEM_HEIGHT, 
    getSectionHeaderHeight: () => HEADER_HEIGHT, 
    getSectionFooterHeight: () => 0, 
  });

  const renderRightActions = (item) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity style={[styles.swipeBtn, styles.editSwipeBtn]} onPress={() => openEditModal(item)}>
        <Text style={styles.swipeBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeBtn, styles.deleteSwipeBtn]} onPress={() => confirmDeleteContact(item.id)}>
        <Text style={styles.swipeBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Contacts</Text>
          <Text style={styles.counterText}>{filteredContacts.length} {filteredContacts.length === 1 ? 'Contact' : 'Contacts'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => {
          setContactForm({ name: "", phones: [""], email: "", tag: "Other" });
          setEditingContactId(null);
          setModalVisible(true);
        }}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search Names..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFiltersContainer}>
        {TAGS.map(tag => (
          <TouchableOpacity key={tag} style={[styles.tagFilterChip, activeFilterTag === tag && styles.tagFilterChipActive]} onPress={() => setActiveFilterTag(tag)}>
            <Text style={[styles.tagFilterText, activeFilterTag === tag && styles.tagFilterTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="person-search" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No Contacts Found</Text>
              <Text style={styles.emptyStateSub}>Try adjusting your search or filters.</Text>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const primaryPhone = item.phoneNumbers?.[0]?.number || "No Number";
            const tag = contactTags[item.id];
            const isFav = favorites.includes(item.id);

            return (
              <View style={styles.cardWrapper}>
                <Swipeable renderRightActions={() => renderRightActions(item)}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => { setSelectedProfile(item); setProfileModalVisible(true); }}>
                    <View style={styles.card}>
                      <View style={styles.avatarContainer}>
                        {item.imageAvailable && item.image?.uri ? (
                          <Image source={{ uri: item.image.uri }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatarPlaceholder, { backgroundColor: isFav ? "#F59E0B" : "#8B5CF6" }]}>
                            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.contactInfo}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.subInfoRow}>
                          <Text style={[styles.number, primaryPhone === "No Number" && { fontStyle: 'italic', color: '#9CA3AF' }]} numberOfLines={1}>
                            {primaryPhone}
                          </Text>
                          {tag && <View style={styles.smallTag}><Text style={styles.smallTagText}>{tag}</Text></View>}
                        </View>
                      </View>
                      
                      <TouchableOpacity onPress={() => copyToClipboard(primaryPhone)} style={styles.actionIconButton}>
                        <Ionicons name="copy-outline" size={20} color="#9CA3AF" />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.actionIconButton}>
                        <Text style={[styles.iconText, isFav && { color: "#F59E0B" }]}>{isFav ? "★" : "☆"}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              </View>
            );
          }}
        />

        <View style={styles.alphabetIndexWrapper}>
          <View style={styles.alphabetIndex}>
            {ALPHABET.map(letter => (
              <TouchableOpacity key={letter} onPress={() => scrollToSection(letter)} hitSlop={{top: 2, bottom: 2, left: 10, right: 10}}>
                <Text style={styles.alphabetText}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Forms and Modals */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingContactId ? "Edit Contact" : "New Contact"}</Text>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} placeholder="Full Name" value={contactForm.name} onChangeText={(text) => setContactForm({ ...contactForm, name: text })} />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" value={contactForm.email} onChangeText={(text) => setContactForm({ ...contactForm, email: text })} />

              <Text style={styles.label}>Tag</Text>
              <View style={styles.tagSelector}>
                {["Work", "Family", "Friends", "Other"].map(tag => (
                  <TouchableOpacity key={tag} style={[styles.tagBtn, contactForm.tag === tag && styles.tagBtnActive]} onPress={() => setContactForm({...contactForm, tag})}>
                    <Text style={[styles.tagBtnText, contactForm.tag === tag && styles.tagBtnTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Phone Numbers</Text>
              {contactForm.phones.map((phone, index) => (
                <View key={index} style={styles.phoneRow}>
                  <TextInput style={[styles.input, styles.phoneInput]} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={(text) => updatePhone(text, index)} />
                  {contactForm.phones.length > 1 && (
                    <TouchableOpacity onPress={() => removePhoneField(index)} style={styles.removePhoneBtn}>
                      <Text style={styles.removePhoneText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity style={styles.addPhoneBtn} onPress={addPhoneField}>
                <Text style={styles.addPhoneText}>+ Add Phone</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContact}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={profileModalVisible} onRequestClose={() => setProfileModalVisible(false)}>
        <View style={styles.profileModalContainer}>
          <View style={styles.profileModalContent}>
            <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setProfileModalVisible(false)}>
              <Text style={styles.closeProfileText}>✕</Text>
            </TouchableOpacity>

            {selectedProfile && (
              <>
                <View style={styles.profileAvatarWrapper}>
                  {selectedProfile.imageAvailable && selectedProfile.image?.uri ? (
                    <Image source={{ uri: selectedProfile.image.uri }} style={styles.profileAvatar} />
                  ) : (
                    <View style={[styles.profileAvatarPlaceholder, { backgroundColor: favorites.includes(selectedProfile.id) ? "#F59E0B" : "#8B5CF6" }]}>
                      <Text style={styles.profileAvatarText}>{getInitials(selectedProfile.name)}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.profileName}>{selectedProfile.name}</Text>
                <View style={styles.profileTagPill}>
                  <Text style={styles.profileTagText}>{contactTags[selectedProfile.id] || "No Tag"}</Text>
                </View>

                <View style={styles.profileActionRow}>
                  <TouchableOpacity style={styles.profileActionBtn} onPress={() => Linking.openURL(`tel:${selectedProfile.phoneNumbers?.[0]?.number}`)}>
                    <Text style={styles.profileActionIcon}>📞</Text>
                    <Text style={styles.profileActionLabel}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileActionBtn} onPress={() => Linking.openURL(`sms:${selectedProfile.phoneNumbers?.[0]?.number}`)}>
                    <Text style={styles.profileActionIcon}>💬</Text>
                    <Text style={styles.profileActionLabel}>Text</Text>
                  </TouchableOpacity>
                  {selectedProfile.emails?.[0]?.email && (
                    <TouchableOpacity style={styles.profileActionBtn} onPress={() => Linking.openURL(`mailto:${selectedProfile.emails[0].email}`)}>
                      <Text style={styles.profileActionIcon}>✉️</Text>
                      <Text style={styles.profileActionLabel}>Email</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.profileActionBtn} onPress={() => shareContact(selectedProfile)}>
                    <Text style={styles.profileActionIcon}>📤</Text>
                    <Text style={styles.profileActionLabel}>Share</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.profileDetailsScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.profileSectionTitle}>Phone Numbers</Text>
                  {selectedProfile.phoneNumbers?.map((p, i) => (
                    <TouchableOpacity key={i} onPress={() => copyToClipboard(p.number)}>
                      <Text style={styles.profileDetailText}>{p.label ? `${p.label}: ` : ""}{p.number} <Ionicons name="copy-outline" size={14} color="#9CA3AF" /></Text>
                    </TouchableOpacity>
                  ))}
                  {(!selectedProfile.phoneNumbers || selectedProfile.phoneNumbers.length === 0) && (
                    <Text style={[styles.profileDetailText, { fontStyle: 'italic', color: '#9CA3AF' }]}>No Number</Text>
                  )}
                  
                  {selectedProfile.emails && selectedProfile.emails.length > 0 && (
                    <>
                      <Text style={styles.profileSectionTitle}>Emails</Text>
                      {selectedProfile.emails.map((e, i) => (
                        <Text key={i} style={styles.profileDetailText}>{e.email}</Text>
                      ))}
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default ContactScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 15 },
  heading: { fontSize: 32, fontWeight: "800", color: "#000", letterSpacing: -0.5 },
  counterText: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginTop: 2 },
  headerButtons: { flexDirection: "row", alignItems: "center" },
  addBtn: { backgroundColor: "#007AFF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F2F2F7", borderRadius: 10, paddingHorizontal: 10 },
  searchIcon: { fontSize: 16, marginRight: 6, color: "#8E8E93" },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: "#000" },
  
  tagFiltersContainer: { paddingHorizontal: 16, maxHeight: 40, marginBottom: 10 },
  tagFilterChip: { backgroundColor: "#F2F2F7", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginRight: 8, alignSelf: 'flex-start' },
  tagFilterChipActive: { backgroundColor: "#007AFF" },
  tagFilterText: { color: "#8E8E93", fontWeight: "600", fontSize: 13 },
  tagFilterTextActive: { color: "#fff" },
  
  listContainer: { flex: 1 },
  sectionHeaderContainer: { height: HEADER_HEIGHT, backgroundColor: "#F9FAFB", justifyContent: "center", paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  sectionHeader: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyStateText: { fontSize: 18, fontWeight: '700', color: '#4B5563', marginTop: 16 },
  emptyStateSub: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },

  cardWrapper: { height: ITEM_HEIGHT, backgroundColor: "#fff" },
  card: { height: ITEM_HEIGHT, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  contactInfo: { flex: 1, justifyContent: "center" },
  name: { fontSize: 17, fontWeight: "600", color: "#000", marginBottom: 2 },
  subInfoRow: { flexDirection: "row", alignItems: "center" },
  number: { color: "#6B7280", fontSize: 14, marginRight: 8 },
  smallTag: { backgroundColor: "#F3F4F6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  smallTagText: { fontSize: 10, color: "#4B5563", fontWeight: "600", textTransform: "uppercase" },
  actionIconButton: { padding: 8 },
  iconText: { fontSize: 20, color: "#D1D5DB" },
  
  swipeActionsContainer: { flexDirection: "row", width: 150, height: "100%" },
  swipeBtn: { flex: 1, justifyContent: "center", alignItems: "center" },
  editSwipeBtn: { backgroundColor: "#007AFF" },
  deleteSwipeBtn: { backgroundColor: "#FF3B30" },
  swipeBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  alphabetIndexWrapper: { position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center", paddingRight: 4 },
  alphabetIndex: { alignItems: "center" },
  alphabetText: { fontSize: 10, fontWeight: "700", color: "#007AFF", marginVertical: 1.5, paddingHorizontal: 4 },

  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(17,24,39,0.7)" },
  modalContent: { width: "90%", maxHeight: "85%", backgroundColor: "#fff", padding: 24, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalScroll: { marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#111827", marginBottom: 20, textAlign: "center" },
  label: { fontWeight: "800", marginBottom: 8, marginTop: 15, color: "#374151", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 16, color: "#111827", fontWeight: "500" },
  tagSelector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagBtn: { backgroundColor: "#F3F4F6", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  tagBtnActive: { backgroundColor: "#111827" },
  tagBtnText: { color: "#4B5563", fontWeight: "700", fontSize: 13 },
  tagBtnTextActive: { color: "#fff" },
  phoneRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  phoneInput: { flex: 1, marginBottom: 0 },
  removePhoneBtn: { marginLeft: 10, backgroundColor: "#FEE2E2", width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  removePhoneText: { fontWeight: "900", color: "#EF4444", fontSize: 16 },
  addPhoneBtn: { marginTop: 5, paddingVertical: 12, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center" },
  addPhoneText: { color: "#3B82F6", fontWeight: "800", fontSize: 14 },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center" },
  cancelBtnText: { color: "#4B5563", fontWeight: "800", fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#111827", alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  profileModalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.7)" },
  profileModalContent: { backgroundColor: "#fff", height: "85%", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  closeProfileBtn: { position: "absolute", top: 20, right: 20, backgroundColor: "#F3F4F6", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  closeProfileText: { fontSize: 18, fontWeight: "900", color: "#4B5563" },
  profileAvatarWrapper: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 20, marginTop: 10 },
  profileAvatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: "#fff" },
  profileAvatarPlaceholder: { width: 130, height: 130, borderRadius: 65, justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#fff" },
  profileAvatarText: { color: "#fff", fontSize: 44, fontWeight: "900" },
  profileName: { fontSize: 32, fontWeight: "900", color: "#111827", marginBottom: 12, textAlign: "center", letterSpacing: -0.5 },
  profileTagPill: { backgroundColor: "#F3F4F6", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginBottom: 35 },
  profileTagText: { fontSize: 13, fontWeight: "800", color: "#4B5563", textTransform: "uppercase", letterSpacing: 1 },
  profileActionRow: { flexDirection: "row", justifyContent: "center", gap: 15, marginBottom: 35, width: "100%" },
  profileActionBtn: { backgroundColor: "#fff", width: 65, height: 65, borderRadius: 32.5, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  profileActionIcon: { fontSize: 22, marginBottom: 4 },
  profileActionLabel: { fontSize: 11, fontWeight: "700", color: "#111827" },
  profileDetailsScroll: { width: "100%", flex: 1 },
  profileSectionTitle: { fontSize: 13, fontWeight: "800", color: "#9CA3AF", marginTop: 10, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 },
  profileDetailText: { fontSize: 18, color: "#111827", fontWeight: "600", marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
});
