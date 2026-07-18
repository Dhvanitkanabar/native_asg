import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function SurveyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [dateString, setDateString] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [errors, setErrors] = useState({});

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

  const handleSubmit = () => {
    if (validate()) {
      Alert.alert('Success', 'Survey Created Successfully!', [
        { text: 'OK', onPress: resetForm }
      ]);
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
    }
  };

  const resetForm = () => {
    setSiteName('');
    setClientName('');
    setDescription('');
    setPriority('');
    setDateObj(new Date());
    setDateString('');
    setErrors({});
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

  // Priority selection (Simple cycle for now, ideally a modal or action sheet)
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
              <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: errors.date ? '#F44336' : (theme.icon + '30') }]}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}>
                  <MaterialIcons name="event" size={24} color={errors.date ? '#F44336' : theme.icon} style={styles.inputIcon} />
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
                onPress={() => {
                  togglePriority();
                  if(errors.priority) setErrors({...errors, priority: null});
                }}
                style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: errors.priority ? '#F44336' : (theme.icon + '30') }]}
              >
                <MaterialIcons name="flag" size={24} color={priority ? getPriorityColor(priority) : (errors.priority ? '#F44336' : theme.icon)} style={styles.inputIcon} />
                <Text style={[styles.input, { color: priority ? getPriorityColor(priority) : (theme.icon + '80'), lineHeight: 54, fontWeight: priority ? 'bold' : 'normal' }]}>
                  {priority || 'Tap to Select'}
                </Text>
              </TouchableOpacity>
              {errors.priority && <Text style={styles.errorText}>{errors.priority}</Text>}
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
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <MaterialIcons name="check-circle" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Survey</Text>
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
  }
});
