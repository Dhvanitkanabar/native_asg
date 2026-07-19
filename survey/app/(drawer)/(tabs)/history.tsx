import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, RefreshControl, 
  TouchableOpacity, TextInput, Alert, ScrollView, Modal,
  Image, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  Search, Download, Trash2, Calendar, MapPin, User, Phone, Info, 
  Share2, ChevronRight, X, Copy, ChevronLeft, Images, Image as ImageIcon
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { AppCard } from '@/components/ui/AppCard';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton } from '@/components/ui/AppButton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [surveys, setSurveys] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useFocusEffect(
    useCallback(() => { loadHistory(); }, [])
  );

  const loadHistory = async () => {
    setIsRefreshing(true);
    try {
      const data = await AsyncStorage.getItem('@surveys_history');
      setSurveys(data ? JSON.parse(data) : []);
    } catch (e) { console.log('Error loading history', e); }
    setIsRefreshing(false);
  };

  const deleteSurvey = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Report', 'Permanently delete this survey report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const updated = surveys.filter((s: any) => s.id !== id);
          setSurveys(updated);
          await AsyncStorage.setItem('@surveys_history', JSON.stringify(updated));
          if (selectedSurvey?.id === id) setSelectedSurvey(null);
        } catch (e) { console.log(e); }
      }}
    ]);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Low': return theme.success;
      case 'Medium': return theme.warning;
      case 'High': return '#F97316';
      case 'Critical': return theme.danger;
      default: return theme.textTertiary;
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  // --- PDF HTML Template Generator ---
  const generatePdfHtml = (survey: any) => {
    const photos = survey.photos || (survey.photoUri ? [survey.photoUri] : []);
    const photosHtml = photos.length > 0
      ? photos.map((uri: string) => `<img src="${uri}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:10px;" />`).join('')
      : '<p style="color:#94A3B8;font-style:italic;">No photos attached</p>';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; background: #fff; color: #0F172A; }
        .header { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: #fff; padding: 28px; border-radius: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 24px; margin-bottom: 6px; }
        .header p { opacity: 0.8; font-size: 14px; }
        .badge { display: inline-block; background: ${getPriorityColor(survey.priority)}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 10px; }
        .section { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; margin-bottom: 16px; }
        .section-title { font-size: 14px; font-weight: 700; color: #6366F1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .field { margin-bottom: 8px; }
        .field-label { font-size: 12px; color: #64748B; font-weight: 600; }
        .field-value { font-size: 15px; color: #0F172A; font-weight: 500; margin-top: 2px; }
        .photos { display: flex; flex-wrap: wrap; gap: 10px; }
        .footer { text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${survey.siteName}</h1>
        <p>Survey ID: ${survey.id} &nbsp;|&nbsp; Date: ${survey.dateString}</p>
        <div class="badge">${survey.priority} Priority</div>
      </div>

      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="field"><div class="field-label">Name</div><div class="field-value">${survey.clientName}</div></div>
        <div class="field"><div class="field-label">Contact</div><div class="field-value">${survey.clientContact || 'Not provided'}</div></div>
      </div>

      <div class="section">
        <div class="section-title">Location</div>
        <div class="field-value">${survey.locationCoords ? `Lat: ${survey.locationCoords.lat}, Lng: ${survey.locationCoords.lng}` : 'No location attached'}</div>
      </div>

      <div class="section">
        <div class="section-title">Survey Notes</div>
        <div class="field-value" style="line-height:1.6;">${survey.description}</div>
      </div>

      <div class="section">
        <div class="section-title">Site Photos (${photos.length})</div>
        <div class="photos">${photosHtml}</div>
      </div>

      <div class="footer">
        Generated by Smart Field Survey App &nbsp;•&nbsp; ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>`;
  };

  const exportSurveyPdf = async (survey: any) => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const html = generatePdfHtml(survey);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Survey Report - ${survey.siteName}` });
    } catch (e) {
      console.log('Export error:', e);
      Alert.alert('Export Error', 'Failed to generate the PDF report.');
    }
    setIsExporting(false);
  };

  const exportAllSurveys = async () => {
    if (surveys.length === 0) {
      Alert.alert('No Surveys', 'There are no surveys to export.');
      return;
    }
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const allHtml = surveys.map(s => generatePdfHtml(s)).join('<div style="page-break-after:always;"></div>');
      const { uri } = await Print.printToFileAsync({ html: allHtml, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'All Surveys Report' });
    } catch (e) {
      Alert.alert('Export Error', 'Failed to generate the PDF report.');
    }
    setIsExporting(false);
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (s.siteName?.toLowerCase().includes(q)) || 
                            (s.clientName?.toLowerCase().includes(q)) ||
                            (s.id?.toLowerCase().includes(q));
      const matchesFilter = selectedFilter === 'All' || s.priority === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [surveys, searchQuery, selectedFilter]);

  const getFilterCount = (p: string) => {
    if (p === 'All') return surveys.length;
    return surveys.filter((s: any) => s.priority === p).length;
  };

  const renderItem = ({ item }: { item: any }) => {
    const photos = item.photos || (item.photoUri ? [item.photoUri] : []);
    return (
      <AppCard variant="elevated" style={styles.historyCard}>
        <TouchableOpacity 
          style={styles.cardRow}
          onPress={() => { 
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedSurvey(item); 
            setModalPhotoIndex(0); 
          }}
          activeOpacity={0.7}
        >
          {photos[0] ? (
            <Image source={{ uri: photos[0] }} style={styles.cardThumb} />
          ) : (
            <View style={[styles.cardThumbPlaceholder, { backgroundColor: getPriorityColor(item.priority) + '12' }]}>
              <ImageIcon size={20} color={getPriorityColor(item.priority)} />
            </View>
          )}
          
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]} numberOfLines={1}>{item.siteName}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]} numberOfLines={1}>{item.clientName}</Text>
            <View style={styles.cardMeta}>
              <Calendar size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMetaText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{item.dateString}</Text>
              {photos.length > 1 && (
                <>
                  <Images size={12} color={theme.textSecondary} style={{ marginLeft: Spacing.sm }} />
                  <Text style={[styles.cardMetaText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{photos.length}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.cardActions}>
            <AppBadge label={item.priority} color={getPriorityColor(item.priority)} />
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => deleteSurvey(item.id)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Trash2 size={16} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AppCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>History</Text>
        <TouchableOpacity 
          style={[styles.exportAllBtn, { backgroundColor: theme.primary + '12' }]} 
          onPress={exportAllSurveys}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <Download size={16} color={theme.primary} />
              <Text style={[styles.exportAllText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Field */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}
            placeholder="Search site, client, or ID..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories / Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {PRIORITIES.map(p => (
            <TouchableOpacity 
              key={p}
              style={[
                styles.filterChip, 
                { 
                  backgroundColor: selectedFilter === p ? theme.primary : theme.surface,
                  borderColor: selectedFilter === p ? theme.primary : theme.border
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(p);
              }}
            >
              <Text style={[
                styles.filterChipText, 
                { color: selectedFilter === p ? '#fff' : theme.textSecondary, fontFamily: Typography.fontFamily.bold }
              ]}>
                {p}
              </Text>
              <View style={[
                styles.filterChipCount,
                { backgroundColor: selectedFilter === p ? 'rgba(255,255,255,0.22)' : (theme.primary + '12') }
              ]}>
                <Text style={[
                  styles.filterChipCountText,
                  { color: selectedFilter === p ? '#fff' : theme.primary, fontFamily: Typography.fontFamily.black }
                ]}>{getFilterCount(p)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Report List */}
      <FlatList
        data={filteredSurveys}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadHistory} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Info size={48} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>No Surveys Found</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
              {surveys.length === 0 ? "You haven't submitted any reports yet." : "No reports match your selected priority filters."}
            </Text>
          </View>
        }
      />

      {/* ====== Details Sheet Modal ====== */}
      <Modal
        visible={!!selectedSurvey}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSurvey(null)}
      >
        {selectedSurvey && (() => {
          const surveyPhotos = selectedSurvey.photos || (selectedSurvey.photoUri ? [selectedSurvey.photoUri] : []);
          return (
            <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => setSelectedSurvey(null)} style={styles.modalCloseBtn}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Survey Details</Text>
                <View style={styles.modalHeaderActions}>
                  <TouchableOpacity 
                    onPress={() => exportSurveyPdf(selectedSurvey)} 
                    style={[styles.modalActionBtn, { backgroundColor: theme.primary + '12' }]}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Share2 size={18} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => deleteSurvey(selectedSurvey.id)} 
                    style={[styles.modalActionBtn, { backgroundColor: theme.danger + '12' }]}
                  >
                    <Trash2 size={18} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Image Gallery Header */}
                <View style={styles.modalHero}>
                  {surveyPhotos.length > 0 ? (
                    <View>
                      <FlatList
                        data={surveyPhotos}
                        horizontal pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => String(i)}
                        onMomentumScrollEnd={(e) => {
                          setModalPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
                        }}
                        renderItem={({ item }) => (
                          <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: 240 }} resizeMode="cover" />
                        )}
                      />
                      {surveyPhotos.length > 1 && (
                        <View style={styles.modalPageIndicators}>
                          {surveyPhotos.map((_: any, i: number) => (
                            <View key={i} style={[
                              styles.modalPageDot, 
                              { backgroundColor: i === modalPhotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }
                            ]} />
                          ))}
                        </View>
                      )}
                      <View style={styles.modalPhotoCount}>
                        <Images size={12} color="#fff" />
                        <Text style={styles.modalPhotoCountText}>{surveyPhotos.length}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.modalHeroPlaceholder, { backgroundColor: theme.primary + '10' }]}>
                      <ImageIcon size={48} color={theme.primary} />
                      <Text style={{ color: theme.primary, marginTop: Spacing.sm, fontFamily: Typography.fontFamily.semiBold }}>No Attached Photos</Text>
                    </View>
                  )}
                  <View style={styles.modalPriorityOverlay}>
                    <AppBadge label={selectedSurvey.priority} color={getPriorityColor(selectedSurvey.priority)} style={styles.modalPriorityBadge} />
                  </View>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.modalContentHeader}>
                    <Text style={[styles.modalSiteName, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{selectedSurvey.siteName}</Text>
                    <TouchableOpacity 
                      style={[styles.modalIdRow, { backgroundColor: theme.primary + '10' }]} 
                      onPress={() => copyToClipboard(selectedSurvey.id, 'Survey ID')}
                    >
                      <Text style={[styles.modalIdText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>ID: {selectedSurvey.id}</Text>
                      <Copy size={12} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.modalDate, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>📅 Recorded Date: {selectedSurvey.dateString}</Text>
                  </View>

                  {/* Client Info Card */}
                  <AppCard variant="elevated" style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <View style={[styles.modalCardIcon, { backgroundColor: theme.primary + '12' }]}>
                        <User size={16} color={theme.primary} />
                      </View>
                      <Text style={[styles.modalCardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Client</Text>
                    </View>
                    <Text style={[styles.modalCardValue, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>{selectedSurvey.clientName}</Text>
                    {selectedSurvey.clientContact ? (
                      <TouchableOpacity style={styles.modalCopyRow} onPress={() => copyToClipboard(selectedSurvey.clientContact, 'Contact')}>
                        <Phone size={13} color={theme.textSecondary} />
                        <Text style={[styles.modalCardSub, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{selectedSurvey.clientContact}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </AppCard>

                  {/* Coordinates Card */}
                  <AppCard variant="elevated" style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <View style={[styles.modalCardIcon, { backgroundColor: theme.success + '12' }]}>
                        <MapPin size={16} color={theme.success} />
                      </View>
                      <Text style={[styles.modalCardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Location Coordinates</Text>
                    </View>
                    <Text style={[styles.modalCardValue, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>
                      {selectedSurvey.locationCoords 
                        ? `Latitude: ${selectedSurvey.locationCoords.lat}, Longitude: ${selectedSurvey.locationCoords.lng}` 
                        : 'No coordinates linked'}
                    </Text>
                  </AppCard>

                  {/* Observations Card */}
                  <AppCard variant="elevated" style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <View style={[styles.modalCardIcon, { backgroundColor: theme.warning + '12' }]}>
                        <Info size={16} color={theme.warning} />
                      </View>
                      <Text style={[styles.modalCardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Notes & Observations</Text>
                    </View>
                    <Text style={[styles.modalCardValue, { color: theme.text, fontFamily: Typography.fontFamily.medium, lineHeight: Spacing.xl }]}>{selectedSurvey.description}</Text>
                  </AppCard>

                  {/* PDF Share Action */}
                  <AppButton 
                    title="Export & Share PDF"
                    onPress={() => exportSurveyPdf(selectedSurvey)}
                    loading={isExporting}
                    style={styles.shareButton}
                    icon={<Share2 size={18} color="#fff" />}
                  />
                  
                  <View style={{ height: Spacing.huge }} />
                </View>
              </ScrollView>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography.fontSize.xxl, letterSpacing: -0.3 },
  exportAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
  },
  exportAllText: { fontSize: Typography.fontSize.xs + 1 },

  // Search
  searchContainer: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.md, paddingHorizontal: Spacing.lg, height: 50,
    borderWidth: 1.5,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.fontSize.md },

  // Filters
  filterContainer: { marginBottom: Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.sm, borderWidth: 1.5, gap: Spacing.xs,
  },
  filterChipText: { fontSize: Typography.fontSize.xs + 1 },
  filterChipCount: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.xs, minWidth: 20, alignItems: 'center' },
  filterChipCountText: { fontSize: 10 },

  // List
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },

  // Cards
  historyCard: { padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 0 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardThumb: { width: 52, height: 52, borderRadius: Radius.sm, marginRight: Spacing.md },
  cardThumbPlaceholder: {
    width: 52, height: 52, borderRadius: Radius.sm, marginRight: Spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.md, marginBottom: 2 },
  cardSubtitle: { fontSize: Typography.fontSize.xs + 1, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: Typography.fontSize.xs },
  cardActions: { alignItems: 'flex-end', gap: Spacing.md },
  deleteBtn: { padding: 4 },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.huge * 1.5, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.fontSize.md + 1 },
  emptyText: { fontSize: Typography.fontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.huge },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1.5,
  },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: Typography.fontSize.md + 1 },
  modalHeaderActions: { flexDirection: 'row', gap: Spacing.sm },
  modalActionBtn: { padding: Spacing.sm, borderRadius: Radius.sm },

  // Modal Hero
  modalHero: { width: '100%', position: 'relative', minHeight: 240 },
  modalHeroPlaceholder: {
    width: '100%', height: 240, justifyContent: 'center', alignItems: 'center',
  },
  modalPageIndicators: {
    position: 'absolute', bottom: Spacing.lg, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
  },
  modalPageDot: { width: 6, height: 6, borderRadius: Radius.full },
  modalPhotoCount: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm,
  },
  modalPhotoCountText: { color: '#fff', fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold },
  modalPriorityOverlay: { position: 'absolute', bottom: -14, right: Spacing.xl, zIndex: 10 },
  modalPriorityBadge: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.xl,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
      android: { elevation: 4 },
    }),
  },

  // Modal Content
  modalContent: { padding: Spacing.xxl },
  modalContentHeader: { marginBottom: Spacing.lg, marginTop: Spacing.xs },
  modalSiteName: { fontSize: Typography.fontSize.xxl, marginBottom: Spacing.xs, letterSpacing: -0.3 },
  modalIdRow: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.sm, gap: Spacing.xs, marginBottom: Spacing.xs,
  },
  modalIdText: { fontSize: Typography.fontSize.xs + 1 },
  modalDate: { fontSize: Typography.fontSize.sm, marginTop: Spacing.xs },

  // Modal Cards
  modalCard: { borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 0 },
  modalCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  modalCardIcon: { width: 30, height: 30, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  modalCardTitle: { fontSize: Typography.fontSize.xs + 1 },
  modalCardValue: { fontSize: Typography.fontSize.sm + 1 },
  modalCardSub: { fontSize: Typography.fontSize.sm },
  modalCopyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },

  // Share
  shareButton: { marginTop: Spacing.md },
});
