import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Alert, 
  TouchableOpacity, Platform, KeyboardAvoidingView, Image, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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
  
  // New Attachments State
  const [photoUri, setPhotoUri] = useState(null);
  const [locationCoords, setLocationCoords] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [surveyId, setSurveyId] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  React.useEffect(() => {
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
          setPhotoUri(parsed.photoUri || null);
          setLocationCoords(parsed.locationCoords || null);
          setSurveyId(parsed.surveyId || '');
          
          if (parsed.dateString) {
            const [y, m, d] = parsed.dateString.split('-');
            if (y && m && d) setDateObj(new Date(y, m - 1, d));
          }
        }
      } catch (e) {
        console.log('Error loading draft', e);
      }
    };

    loadDraft();
  }, []);

  const generateId = () => {
    return 'SRV-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

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
        dateString, photoUri, locationCoords, surveyId: currentId
      };
      
      try {
        await AsyncStorage.setItem('@draft_survey', JSON.stringify(draftData));
        setIsPreviewMode(true);
      } catch (e) {
        console.log(e);
      }
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
              dateString, photoUri, locationCoords,
              submittedAt: new Date().toISOString()
            };
            const existing = await AsyncStorage.getItem('@surveys_history');
            let history = existing ? JSON.parse(existing) : [];
            history.unshift(newSurvey); // Add to top of list
            await AsyncStorage.setItem('@surveys_history', JSON.stringify(history));

            await AsyncStorage.removeItem('@draft_survey');
            resetForm();
            router.push('/(drawer)/(tabs)/history'); // Redirect to history tab to see it
          } catch (error) {
            console.log('Error saving survey history:', error);
          }
        } 
      }
    ]);
  };

  const resetForm = () => {
    setSiteName('');
    setClientName('');
    setClientContact('');
    setDescription('');
    setPriority('');
    setDateObj(new Date());
    setDateString('');
    setPhotoUri(null);
    setLocationCoords(null);
    setSurveyId('');
    setErrors({});
    setIsPreviewMode(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
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

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const formatDate = (dObj) => {
    return `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
  };

  const togglePriority = () => {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const currentIndex = priorities.indexOf(priority);
    setPriority(priorities[(currentIndex + 1) % priorities.length]);
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

  if (isPreviewMode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Hero Image Section */}
          <View style={styles.previewHero}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImagePlaceholder, { backgroundColor: theme.tint + '20' }]}>
                <Ionicons name="image-outline" size={64} color={theme.tint} />
                <Text style={{ color: theme.tint, marginTop: 10, fontWeight: '600' }}>No Photo Attached</Text>
              </View>
            )}
            <View style={styles.previewOverlay}>
              <View style={[styles.previewBadge, { backgroundColor: getPriorityColor(priority) }]}>
                <Text style={styles.previewBadgeText}>{priority} Priority</Text>
              </View>
            </View>
          </View>

          <View style={styles.previewContent}>
            {/* Header Details */}
            <View style={styles.previewHeader}>
              <Text style={[styles.previewSiteName, { color: theme.text }]}>{siteName}</Text>
              <TouchableOpacity style={styles.previewIdRow} onPress={() => copyToClipboard(surveyId, 'Survey ID')}>
                <Text style={styles.previewIdText}>ID: {surveyId}</Text>
                <Ionicons name="copy-outline" size={14} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.previewDate}>📅 Date: {dateString}</Text>
            </View>

            {/* Client Card */}
            <View style={[styles.previewCard, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={24} color={theme.tint} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Client Information</Text>
              </View>
              <Text style={[styles.cardText, { color: theme.text }]}>{clientName}</Text>
              {clientContact ? (
                <TouchableOpacity style={styles.copyRow} onPress={() => copyToClipboard(clientContact, 'Contact Number')}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text style={styles.cardSubtext}>{clientContact}</Text>
                  <Ionicons name="copy-outline" size={14} color="#6B7280" />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardSubtext, { fontStyle: 'italic' }]}>No contact provided</Text>
              )}
            </View>

            {/* Location Card */}
            <View style={[styles.previewCard, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="location-outline" size={24} color="#4CAF50" />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Site Location</Text>
              </View>
              {locationCoords ? (
                <TouchableOpacity style={styles.copyRow} onPress={() => copyToClipboard(`${locationCoords.lat}, ${locationCoords.lng}`, 'Coordinates')}>
                  <Text style={[styles.cardText, { color: theme.text }]}>
                    Lat: {locationCoords.lat}, Lng: {locationCoords.lng}
                  </Text>
                  <Ionicons name="copy-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardSubtext, { fontStyle: 'italic' }]}>No location attached</Text>
              )}
            </View>

            {/* Notes Card */}
            <View style={[styles.previewCard, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={24} color="#FF9800" />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Survey Notes</Text>
              </View>
              <Text style={[styles.cardText, { color: theme.text, lineHeight: 22 }]}>{description}</Text>
            </View>
            
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Floating Action Buttons */}
        <View style={[styles.fabContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity style={[styles.fabEdit, { borderColor: theme.tint }]} onPress={() => setIsPreviewMode(false)}>
            <Text style={[styles.fabEditText, { color: theme.tint }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fabSubmit, { backgroundColor: theme.tint }]} onPress={handleSubmit}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.fabSubmitText}>Confirm & Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // FORM VIEW
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <MaterialIcons name="assignment-add" size={32} color={theme.tint} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>New Survey</Text>
            <Text style={[styles.headerSubtitle, { color: theme.icon }]}>Fill out the details below to create a new site inspection record.</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Site Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: errors.siteName ? '#F44336' : (theme.icon + '30') }]}>
                <MaterialIcons name="place" size={22} color={errors.siteName ? '#F44336' : theme.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. Downtown Office Building"
                  placeholderTextColor={theme.icon + '80'}
                  value={siteName}
                  onChangeText={(val) => { setSiteName(val); if(errors.siteName) setErrors({...errors, siteName: null}); }}
                />
              </View>
              {errors.siteName && <Text style={styles.errorText}>{errors.siteName}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Client Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: errors.clientName ? '#F44336' : (theme.icon + '30') }]}>
                <MaterialIcons name="person" size={22} color={errors.clientName ? '#F44336' : theme.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor={theme.icon + '80'}
                  value={clientName}
                  onChangeText={(val) => { setClientName(val); if(errors.clientName) setErrors({...errors, clientName: null}); }}
                />
              </View>
              {errors.clientName && <Text style={styles.errorText}>{errors.clientName}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Client Contact</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.icon + '30' }]}>
                <MaterialIcons name="phone" size={22} color={theme.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. +1 234 567 890"
                  placeholderTextColor={theme.icon + '80'}
                  keyboardType="phone-pad"
                  value={clientContact}
                  onChangeText={setClientContact}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: errors.date ? '#F44336' : (theme.icon + '30') }]}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}>
                  <MaterialIcons name="event" size={22} color={errors.date ? '#F44336' : theme.icon} style={styles.inputIcon} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.icon + '80'}
                  value={dateString}
                  onChangeText={(val) => { setDateString(val); if(errors.date) setErrors({...errors, date: null}); }}
                />
              </View>
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Priority *</Text>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => { togglePriority(); if(errors.priority) setErrors({...errors, priority: null}); }}
                style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: errors.priority ? '#F44336' : (theme.icon + '30') }]}
              >
                <MaterialIcons name="flag" size={22} color={priority ? getPriorityColor(priority) : (errors.priority ? '#F44336' : theme.icon)} style={styles.inputIcon} />
                <Text style={[styles.input, { color: priority ? getPriorityColor(priority) : (theme.icon + '80'), lineHeight: 54, fontWeight: priority ? 'bold' : 'normal' }]}>
                  {priority || 'Select'}
                </Text>
              </TouchableOpacity>
              {errors.priority && <Text style={styles.errorText}>{errors.priority}</Text>}
            </View>

            {/* Location Attachment */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Location Tag</Text>
              <View style={styles.attachmentRow}>
                <TouchableOpacity style={styles.attachBtn} onPress={fetchLocation} disabled={isFetchingLocation}>
                  {isFetchingLocation ? <ActivityIndicator size="small" color="#007AFF" /> : <Ionicons name="location" size={20} color="#007AFF" />}
                  <Text style={styles.attachBtnText}>{locationCoords ? 'Update Location' : 'Tag Current Location'}</Text>
                </TouchableOpacity>
                {locationCoords && <Text style={styles.attachedText}>📍 attached</Text>}
              </View>
            </View>

            {/* Photo Attachment */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Site Photo</Text>
              <View style={styles.attachmentRow}>
                <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                  <Ionicons name="camera" size={20} color="#007AFF" />
                  <Text style={styles.attachBtnText}>{photoUri ? 'Change Photo' : 'Attach Photo'}</Text>
                </TouchableOpacity>
                {photoUri && <Text style={styles.attachedText}>🖼️ attached</Text>}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: theme.background, borderColor: errors.description ? '#F44336' : (theme.icon + '30') }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: theme.text }]}
                  placeholder="Enter detailed observations, requirements, or notes..."
                  placeholderTextColor={theme.icon + '80'}
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={(val) => { setDescription(val); if(errors.description) setErrors({...errors, description: null}); }}
                />
              </View>
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.tint, shadowColor: theme.tint }]} 
            onPress={handleReview}
            activeOpacity={0.8}
          >
            <Ionicons name="eye" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>Review Survey</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
      
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={dateObj}
        onConfirm={handleConfirmDate}
        onCancel={handleCancelDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '700',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  attachBtnText: {
    color: '#007AFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  attachedText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 16,
    marginBottom: 40,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // PREVIEW STYLES
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardSubtext: {
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
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'space-between',
    gap: 16,
  },
  fabEdit: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  fabEditText: {
    fontWeight: '800',
    fontSize: 16,
  },
  fabSubmit: {
    flex: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  fabSubmitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 8,
  }
});
