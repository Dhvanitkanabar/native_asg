import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

export default function SurveyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = () => {
    if (!siteName || !clientName || !description || !priority || !date) {
      Alert.alert('Validation Error', 'All fields are required!');
      return;
    }

    Alert.alert('Success', 'Survey Created Successfully!');
    setSiteName('');
    setClientName('');
    setDescription('');
    setPriority('');
    setDate('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Survey</Text>
          <Text style={[styles.headerSubtitle, { color: theme.icon }]}>Fill out the details below to create a new site inspection record.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Site Name *</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.icon + '40' }]}>
            <MaterialIcons name="place" size={20} color={theme.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. Downtown Office Building"
              placeholderTextColor={theme.icon}
              value={siteName}
              onChangeText={setSiteName}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Client Name *</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.icon + '40' }]}>
            <MaterialIcons name="person" size={20} color={theme.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. Acme Corp"
              placeholderTextColor={theme.icon}
              value={clientName}
              onChangeText={setClientName}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.icon + '40' }]}>
            <MaterialIcons name="event" size={20} color={theme.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.icon}
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Priority *</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.icon + '40' }]}>
            <MaterialIcons name="priority-high" size={20} color={theme.icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. High, Medium, Low"
              placeholderTextColor={theme.icon}
              value={priority}
              onChangeText={setPriority}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: theme.background, borderColor: theme.icon + '40' }]}>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text }]}
              placeholder="Enter survey details..."
              placeholderTextColor={theme.icon}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.tint }]} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <MaterialIcons name="check-circle" size={22} color="#fff" />
          <Text style={styles.submitButtonText}>Submit Survey</Text>
        </TouchableOpacity>
        
      </ScrollView>
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
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});
