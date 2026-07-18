import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, RefreshControl, 
  TouchableOpacity, TextInput, Alert, ScrollView, Modal,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [surveys, setSurveys] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Modal State
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    setIsRefreshing(true);
    try {
      const data = await AsyncStorage.getItem('@surveys_history');
      if (data) {
        setSurveys(JSON.parse(data));
      } else {
        setSurveys([]);
      }
    } catch (e) {
      console.log('Error loading history', e);
    }
    setIsRefreshing(false);
  };

  const deleteSurvey = (id) => {
    Alert.alert(
      'Delete Survey',
      'Are you sure you want to permanently delete this survey? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = surveys.filter(s => s.id !== id);
              setSurveys(updated);
              await AsyncStorage.setItem('@surveys_history', JSON.stringify(updated));
              if (selectedSurvey?.id === id) {
                setSelectedSurvey(null);
              }
            } catch (error) {
              console.log('Error deleting survey', error);
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'High': return '#FF5722';
      case 'Critical': return '#F44336';
      default: return theme.icon;
    }
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      const matchesSearch = (s.siteName?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                            (s.clientName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (s.id?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = selectedFilter === 'All' || s.priority === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [surveys, searchQuery, selectedFilter]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.historyCard, { backgroundColor: theme.background, borderColor: 'rgba(0,0,0,0.05)' }]}
      onPress={() => setSelectedSurvey(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.siteName}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{item.clientName}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.footerText}>{item.dateString}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
          <Text style={styles.footerText}>{item.id}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => deleteSurvey(item.id)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F3F4F6' }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Survey History</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.background }]}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by Site, Client, or ID..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {PRIORITIES.map(p => (
            <TouchableOpacity 
              key={p}
              style={[
                styles.filterChip, 
                { 
                  backgroundColor: selectedFilter === p ? theme.tint : theme.background,
                  borderColor: selectedFilter === p ? theme.tint : '#E5E7EB'
                }
              ]}
              onPress={() => setSelectedFilter(p)}
            >
              <Text style={[
                styles.filterChipText, 
                { color: selectedFilter === p ? '#fff' : '#6B7280' }
              ]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredSurveys}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadHistory} tintColor={theme.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Surveys Found</Text>
            <Text style={styles.emptyText}>
              {surveys.length === 0 ? "You haven't submitted any surveys yet." : "No surveys match your current search filters."}
            </Text>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal
        visible={!!selectedSurvey}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSurvey(null)}
      >
        {selectedSurvey && (
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedSurvey(null)} style={styles.modalCloseBtn}>
                <Ionicons name="chevron-down" size={28} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Survey Details</Text>
              <TouchableOpacity onPress={() => deleteSurvey(selectedSurvey.id)} style={styles.modalDeleteBtn}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Using similar UI as Preview for consistency */}
              <View style={styles.previewHero}>
                {selectedSurvey.photoUri ? (
                  <Image source={{ uri: selectedSurvey.photoUri }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImagePlaceholder, { backgroundColor: theme.tint + '20' }]}>
                    <Ionicons name="image-outline" size={64} color={theme.tint} />
                    <Text style={{ color: theme.tint, marginTop: 10, fontWeight: '600' }}>No Photo Attached</Text>
                  </View>
                )}
                <View style={styles.previewOverlay}>
                  <View style={[styles.previewBadge, { backgroundColor: getPriorityColor(selectedSurvey.priority) }]}>
                    <Text style={styles.previewBadgeText}>{selectedSurvey.priority} Priority</Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewSiteName, { color: theme.text }]}>{selectedSurvey.siteName}</Text>
                  <TouchableOpacity style={styles.previewIdRow} onPress={() => copyToClipboard(selectedSurvey.id, 'Survey ID')}>
                    <Text style={styles.previewIdText}>ID: {selectedSurvey.id}</Text>
                    <Ionicons name="copy-outline" size={14} color="#6B7280" />
                  </TouchableOpacity>
                  <Text style={styles.previewDate}>📅 Date: {selectedSurvey.dateString}</Text>
                </View>

                {/* Client Card */}
                <View style={[styles.previewCard, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
                  <View style={styles.cardHeaderModal}>
                    <Ionicons name="person-circle-outline" size={24} color={theme.tint} />
                    <Text style={[styles.cardTitleModal, { color: theme.text }]}>Client Information</Text>
                  </View>
                  <Text style={[styles.cardTextModal, { color: theme.text }]}>{selectedSurvey.clientName}</Text>
                  {selectedSurvey.clientContact ? (
                    <TouchableOpacity style={styles.copyRow} onPress={() => copyToClipboard(selectedSurvey.clientContact, 'Contact Number')}>
                      <Ionicons name="call-outline" size={16} color="#6B7280" />
                      <Text style={styles.cardSubtextModal}>{selectedSurvey.clientContact}</Text>
                      <Ionicons name="copy-outline" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.cardSubtextModal, { fontStyle: 'italic' }]}>No contact provided</Text>
                  )}
                </View>

                {/* Location Card */}
                <View style={[styles.previewCard, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
                  <View style={styles.cardHeaderModal}>
                    <Ionicons name="location-outline" size={24} color="#4CAF50" />
                    <Text style={[styles.cardTitleModal, { color: theme.text }]}>Site Location</Text>
                  </View>
                  {selectedSurvey.locationCoords ? (
                    <TouchableOpacity style={styles.copyRow} onPress={() => copyToClipboard(`${selectedSurvey.locationCoords.lat}, ${selectedSurvey.locationCoords.lng}`, 'Coordinates')}>
                      <Text style={[styles.cardTextModal, { color: theme.text }]}>
                        Lat: {selectedSurvey.locationCoords.lat}, Lng: {selectedSurvey.locationCoords.lng}
                      </Text>
                      <Ionicons name="copy-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.cardSubtextModal, { fontStyle: 'italic' }]}>No location attached</Text>
                  )}
                </View>

                {/* Notes Card */}
                <View style={[styles.previewCard, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
                  <View style={styles.cardHeaderModal}>
                    <Ionicons name="document-text-outline" size={24} color="#FF9800" />
                    <Text style={[styles.cardTitleModal, { color: theme.text }]}>Survey Notes</Text>
                  </View>
                  <Text style={[styles.cardTextModal, { color: theme.text, lineHeight: 22 }]}>{selectedSurvey.description}</Text>
                </View>
                
                <View style={{ height: 40 }} />
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 30, // space for delete button
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    padding: 4,
  },
  previewHero: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: -15,
    right: 20,
    zIndex: 10,
  },
  previewBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  previewBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  previewContent: {
    padding: 24,
  },
  previewHeader: {
    marginBottom: 24,
    marginTop: 10,
  },
  previewSiteName: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  previewIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewIdText: {
    color: '#6B7280',
    fontWeight: '700',
    marginRight: 6,
    fontSize: 12,
  },
  previewDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeaderModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleModal: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  cardTextModal: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardSubtextModal: {
    color: '#6B7280',
    fontSize: 14,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
});
