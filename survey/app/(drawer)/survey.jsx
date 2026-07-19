import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Alert, 
  TouchableOpacity, Platform, KeyboardAvoidingView, Image, 
  ActivityIndicator, FlatList, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  Building, User, Phone, Calendar, Image as ImageIcon, Camera, 
  MapPin, Clipboard, CheckCircle, Info, ChevronRight, Eye, Edit2, Check 
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as ClipboardPkg from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppBadge } from '@/components/ui/AppBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_PHOTOS = 5;

export default function SurveyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Form State
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [dateString, setDateString] = useState('');
  
  // Multi-photo state
  const [photos, setPhotos] = useState([]);
  const [locationCoords, setLocationCoords] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [surveyId, setSurveyId] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const data = await AsyncStorage.getItem('@draft_survey');
        if (data) {
          const parsed = JSON.parse(data);
          setSiteName(parsed.siteName || '');
          setClientName(parsed.clientName || '');
          setClientContact(parsed.clientContact || '');
          setDescription(parsed.description || '');
          setPriority(parsed.priority || '');
          setDateString(parsed.dateString || '');
          if (parsed.photos && parsed.photos.length > 0) {
            setPhotos(parsed.photos);
          } else if (parsed.photoUri) {
            setPhotos([parsed.photoUri]);
          }
          setLocationCoords(parsed.locationCoords || null);
          setSurveyId(parsed.surveyId || '');
          
          if (parsed.dateString) {
            const [y, m, d] = parsed.dateString.split('-');
            if (y && m && d) setDateObj(new Date(Number(y), Number(m) - 1, Number(d)));
          }
        }
      } catch (e) {
        console.log('Error loading draft', e);
      }
    };
    loadDraft();
  }, []);

  const generateId = () => 'SRV-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const validate = () => {
    const newErrors = {};
    if (!siteName.trim()) newErrors.siteName = 'Site Name is required';
    if (!clientName.trim()) newErrors.clientName = 'Client Name is required';
    if (!dateString.trim()) newErrors.date = 'Date is required';
    if (!priority.trim()) newErrors.priority = 'Priority is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReview = async () => {
    if (validate()) {
      let currentId = surveyId;
      if (!currentId) {
        currentId = generateId();
        setSurveyId(currentId);
      }
      const draftData = {
        siteName, clientName, clientContact, description, priority, 
        dateString, photos, locationCoords, surveyId: currentId
      };
      try {
        await AsyncStorage.setItem('@draft_survey', JSON.stringify(draftData));
        setIsPreviewMode(true);
        setPreviewPhotoIndex(0);
      } catch (e) { console.log(e); }
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
    }
  };

  const handleSubmit = async () => {
    Alert.alert('Success', 'Survey Submitted Successfully!', [
      { 
        text: 'OK', 
        onPress: async () => {
          try {
            const newSurvey = {
              id: surveyId,
              siteName, clientName, clientContact, description, priority, 
              dateString, photos, photoUri: photos[0] || null, locationCoords,
              submittedAt: new Date().toISOString()
            };
            const existing = await AsyncStorage.getItem('@surveys_history');
            let history = existing ? JSON.parse(existing) : [];
            history.unshift(newSurvey);
            await AsyncStorage.setItem('@surveys_history', JSON.stringify(history));
            await AsyncStorage.removeItem('@draft_survey');
            resetForm();
            router.push('/(drawer)/(tabs)/history');
          } catch (error) {
            console.log('Error saving survey history:', error);
          }
        } 
      }
    ]);
  };

  const resetForm = () => {
    setSiteName(''); setClientName(''); setClientContact('');
    setDescription(''); setPriority(''); setDateObj(new Date());
    setDateString(''); setPhotos([]); setLocationCoords(null);
    setSurveyId(''); setErrors({}); setIsPreviewMode(false);
  };

  const pickImageFromGallery = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can attach a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is required.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  };

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can attach a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const fetchLocation = async () => {
    setIsFetchingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied');
      setIsFetchingLocation(false);
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationCoords({
        lat: location.coords.latitude.toFixed(5),
        lng: location.coords.longitude.toFixed(5)
      });
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location.');
    }
    setIsFetchingLocation(false);
  };

  const handleConfirmDate = (selectedDate) => {
    setShowDatePicker(false);
    setDateObj(selectedDate);
    setDateString(formatDate(selectedDate));
  };

  const formatDate = (dObj) => {
    return `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
  };

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Low': return theme.success;
      case 'Medium': return theme.warning;
      case 'High': return '#F97316';
      case 'Critical': return theme.danger;
      default: return theme.textTertiary;
    }
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    await ClipboardPkg.setStringAsync(text);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  if (isPreviewMode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Photo Carousel Preview */}
          <View style={styles.previewHero}>
            {photos.length > 0 ? (
              <View>
                <FlatList
                  data={photos}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, i) => String(i)}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setPreviewPhotoIndex(idx);
                  }}
                  renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: 260 }} resizeMode="cover" />
                  )}
                />
                {photos.length > 1 && (
                  <View style={styles.pageIndicators}>
                    {photos.map((_, i) => (
                      <View key={i} style={[
                        styles.pageIndicatorDot, 
                        { backgroundColor: i === previewPhotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }
                      ]} />
                    ))}
                  </View>
                )}
                <View style={styles.photoCountBadge}>
                  <ImageIcon size={14} color="#fff" />
                  <Text style={styles.photoCountText}>{photos.length} photo{photos.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.previewImagePlaceholder, { backgroundColor: theme.primary + '10' }]}>
                <ImageIcon size={48} color={theme.primary} />
                <Text style={{ color: theme.primary, marginTop: Spacing.sm, fontFamily: Typography.fontFamily.semiBold }}>No Photos Attached</Text>
              </View>
            )}
            <View style={styles.previewOverlay}>
              <AppBadge label={priority} color={getPriorityColor(priority)} style={styles.previewBadge} />
            </View>
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewSiteName, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>{siteName}</Text>
              <TouchableOpacity style={[styles.previewIdRow, { backgroundColor: theme.primary + '10' }]} onPress={() => copyToClipboard(surveyId, 'Survey ID')}>
                <Text style={[styles.previewIdText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>ID: {surveyId}</Text>
                <Clipboard size={14} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.previewDate, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>📅 Date: {dateString}</Text>
            </View>

            {/* Client Info */}
            <AppCard variant="elevated" style={styles.previewCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: theme.primary + '12' }]}>
                  <User size={18} color={theme.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Client Information</Text>
              </View>
              <Text style={[styles.cardText, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>{clientName}</Text>
              {clientContact ? (
                <TouchableOpacity style={styles.copyRow} onPress={() => copyToClipboard(clientContact, 'Contact')}>
                  <Phone size={14} color={theme.textSecondary} />
                  <Text style={[styles.cardSubtext, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{clientContact}</Text>
                  <Clipboard size={12} color={theme.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardSubtext, { fontStyle: 'italic', color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>No contact provided</Text>
              )}
            </AppCard>

            {/* Site Location */}
            <AppCard variant="elevated" style={styles.previewCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: theme.success + '12' }]}>
                  <MapPin size={18} color={theme.success} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Site Location</Text>
              </View>
              {locationCoords ? (
                <TouchableOpacity style={styles.copyRow} onPress={() => copyToClipboard(`${locationCoords.lat}, ${locationCoords.lng}`, 'Coordinates')}>
                  <Text style={[styles.cardText, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Lat: {locationCoords.lat}, Lng: {locationCoords.lng}</Text>
                  <Clipboard size={14} color={theme.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardSubtext, { fontStyle: 'italic', color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>No location attached</Text>
              )}
            </AppCard>

            {/* Notes */}
            <AppCard variant="elevated" style={styles.previewCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: theme.warning + '12' }]}>
                  <Info size={18} color={theme.warning} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Survey Notes</Text>
              </View>
              <Text style={[styles.cardText, { color: theme.text, fontFamily: Typography.fontFamily.medium, lineHeight: Spacing.xl }]}>{description}</Text>
            </AppCard>
            
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {/* Action Controls */}
        <View style={[styles.fabContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <AppButton 
            title="Edit" 
            variant="outline" 
            onPress={() => setIsPreviewMode(false)} 
            style={styles.fabEdit} 
            icon={<Edit2 size={16} color={theme.primary} />}
          />
          <AppButton 
            title="Confirm & Submit" 
            onPress={handleSubmit} 
            style={styles.fabSubmit} 
            icon={<Check size={18} color="#fff" />}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.primary + '12' }]}>
              <Building size={32} color={theme.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>New Survey</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
              Record the inspection observations and client details below.
            </Text>
          </View>

          <AppCard variant="elevated" style={styles.formCard}>
            <AppInput
              label="Site Name *"
              placeholder="e.g. Downtown Office Center"
              value={siteName}
              onChangeText={(val) => { setSiteName(val); if(errors.siteName) setErrors({...errors, siteName: null}); }}
              error={errors.siteName}
              icon={<Building size={18} color={theme.textTertiary} />}
            />

            <AppInput
              label="Client Name *"
              placeholder="e.g. Acme Corp"
              value={clientName}
              onChangeText={(val) => { setClientName(val); if(errors.clientName) setErrors({...errors, clientName: null}); }}
              error={errors.clientName}
              icon={<User size={18} color={theme.textTertiary} />}
            />

            <AppInput
              label="Client Contact"
              placeholder="e.g. +1 234 567 890"
              keyboardType="phone-pad"
              value={clientContact}
              onChangeText={setClientContact}
              icon={<Phone size={18} color={theme.textTertiary} />}
            />

            {/* Date Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Date *</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: errors.date ? theme.danger : theme.border }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={18} color={theme.textTertiary} style={styles.inputIcon} />
                <Text style={[styles.input, { color: dateString ? theme.text : theme.textTertiary, fontFamily: Typography.fontFamily.medium, lineHeight: 54 }]}>
                  {dateString || 'Select a date'}
                </Text>
              </TouchableOpacity>
              {errors.date && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.date}</Text>}
            </View>

            {/* Priority Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Priority *</Text>
              <View style={styles.priorityRow}>
                {priorities.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      { 
                        backgroundColor: priority === p ? getPriorityColor(p) + '15' : theme.surface,
                        borderColor: priority === p ? getPriorityColor(p) : theme.border,
                      }
                    ]}
                    onPress={() => { setPriority(p); if(errors.priority) setErrors({...errors, priority: null}); }}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p) }]} />
                    <Text style={[styles.priorityChipText, { color: priority === p ? getPriorityColor(p) : theme.textSecondary, fontFamily: Typography.fontFamily.bold }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.priority && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.priority}</Text>}
            </View>

            {/* Location Fetch */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Location Tag</Text>
              <TouchableOpacity 
                style={[styles.attachBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]} 
                onPress={fetchLocation} 
                disabled={isFetchingLocation}
              >
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <MapPin size={18} color={theme.primary} />
                )}
                <Text style={[styles.attachBtnText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>
                  {locationCoords ? 'Location Attached' : 'Tag GPS Location'}
                </Text>
                {locationCoords && (
                  <View style={styles.attachedBadge}>
                    <CheckCircle size={16} color={theme.success} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Photo List */}
            <View style={styles.formGroup}>
              <View style={styles.photoLabelRow}>
                <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.semiBold, marginBottom: 0 }]}>Site Photos</Text>
                <Text style={[styles.photoCountLabel, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>{photos.length}/{MAX_PHOTOS}</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery} contentContainerStyle={styles.photoGalleryContent}>
                {photos.map((uri, i) => (
                  <View key={i} style={styles.photoThumbContainer}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(i)}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <View style={styles.addPhotoButtons}>
                    <TouchableOpacity 
                      style={[styles.addPhotoBtn, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]} 
                      onPress={pickImageFromGallery}
                    >
                      <ImageIcon size={20} color={theme.primary} />
                      <Text style={[styles.addPhotoBtnText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.addPhotoBtn, { backgroundColor: theme.accent + '08', borderColor: theme.accent + '20' }]} 
                      onPress={takePhoto}
                    >
                      <Camera size={20} color={theme.accent} />
                      <Text style={[styles.addPhotoBtnText, { color: theme.accent, fontFamily: Typography.fontFamily.bold }]}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Description Textarea */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: theme.surface, borderColor: errors.description ? theme.danger : theme.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: theme.text, fontFamily: Typography.fontFamily.medium }]}
                  placeholder="Enter detailed observation comments..."
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={(val) => { setDescription(val); if(errors.description) setErrors({...errors, description: null}); }}
                />
              </View>
              {errors.description && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.description}</Text>}
            </View>
          </AppCard>

          <AppButton 
            title="Review Survey" 
            onPress={handleReview}
            icon={<Eye size={20} color="#fff" />}
            style={styles.submitButton}
          />
          
        </ScrollView>
      </KeyboardAvoidingView>
      
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={dateObj}
        onConfirm={handleConfirmDate}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xxl },

  // Header
  header: { marginBottom: Spacing.xl, alignItems: 'center' },
  headerIconContainer: {
    width: 64, height: 64, borderRadius: Radius.lg,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography.fontSize.xxl, marginBottom: Spacing.xs, textAlign: 'center', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: Typography.fontSize.sm, lineHeight: 22, textAlign: 'center', paddingHorizontal: Spacing.lg },

  // Form Card
  formCard: { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.xl },
  formGroup: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.fontSize.sm, marginBottom: Spacing.xs, marginLeft: Spacing.xs },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, height: 56,
  },
  textAreaContainer: { height: 110, alignItems: 'flex-start', paddingVertical: Spacing.md },
  inputIcon: { marginRight: Spacing.md },
  input: { flex: 1, fontSize: Typography.fontSize.md, height: '100%' },
  textArea: { textAlignVertical: 'top' },
  errorText: { fontSize: Typography.fontSize.xs, marginTop: Spacing.xs, marginLeft: Spacing.xs, fontFamily: Typography.fontFamily.bold },

  // Priority Chips
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  priorityChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm,
    borderWidth: 1.5, gap: Spacing.xs,
  },
  priorityDot: { width: 8, height: 8, borderRadius: Radius.full },
  priorityChipText: { fontSize: Typography.fontSize.sm },

  // Attach button
  attachBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md, borderWidth: 1.5, gap: Spacing.sm,
  },
  attachBtnText: { fontSize: Typography.fontSize.sm + 1 },
  attachedBadge: { marginLeft: 'auto' },

  // Photo gallery
  photoLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  photoCountLabel: { fontSize: Typography.fontSize.xs },
  photoGallery: { marginTop: Spacing.xs },
  photoGalleryContent: { gap: Spacing.sm },
  photoThumbContainer: { position: 'relative' },
  photoThumb: { width: 80, height: 80, borderRadius: Radius.sm },
  photoRemoveBtn: { 
    position: 'absolute', top: -5, right: -5, 
    backgroundColor: '#EF4444', width: 20, height: 20, 
    borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' 
  },
  removeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  addPhotoButtons: { flexDirection: 'row', gap: Spacing.sm },
  addPhotoBtn: {
    width: 80, height: 80, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', gap: Spacing.xs,
  },
  addPhotoBtnText: { fontSize: 10 },

  // Review
  submitButton: { marginBottom: Spacing.huge },
  
  // Preview
  previewHero: { width: '100%', position: 'relative', minHeight: 260 },
  previewImagePlaceholder: {
    width: '100%', height: 260, justifyContent: 'center', alignItems: 'center',
  },
  pageIndicators: {
    position: 'absolute', bottom: Spacing.lg, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
  },
  pageIndicatorDot: { width: 6, height: 6, borderRadius: Radius.full },
  photoCountBadge: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm,
  },
  photoCountText: { color: '#fff', fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold },
  previewOverlay: { position: 'absolute', bottom: -14, right: Spacing.xl, zIndex: 10 },
  previewBadge: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.xl,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  previewContent: { padding: Spacing.xxl },
  previewHeader: { marginBottom: Spacing.xl, marginTop: Spacing.sm },
  previewSiteName: { fontSize: Typography.fontSize.xxl, marginBottom: Spacing.xs, letterSpacing: -0.3 },
  previewIdRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs,
    alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm, gap: Spacing.xs,
  },
  previewIdText: { fontSize: Typography.fontSize.xs + 1 },
  previewDate: { fontSize: Typography.fontSize.sm, marginTop: Spacing.xs },
  previewCard: { borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  cardIconCircle: { width: 34, height: 34, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: Typography.fontSize.sm + 1 },
  cardText: { fontSize: Typography.fontSize.md },
  cardSubtext: { fontSize: Typography.fontSize.sm, marginTop: 4 },
  copyRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm,
    gap: Spacing.xs, padding: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: Radius.sm, alignSelf: 'flex-start'
  },

  // FAB
  fabContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl + 10 : Spacing.lg,
    borderTopWidth: 1,
    justifyContent: 'space-between', gap: Spacing.md,
  },
  fabEdit: { flex: 1 },
  fabSubmit: { flex: 2 },
});
