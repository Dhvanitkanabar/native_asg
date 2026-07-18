import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';

export default function SurveyScreen() {
  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = () => {
    // Validate Required Fields
    if (!siteName || !clientName || !description || !priority || !date) {
      Alert.alert('Validation Error', 'All fields are required!');
      return;
    }

    Alert.alert('Success', 'Survey Created Successfully!');
    // Reset fields after submit
    setSiteName('');
    setClientName('');
    setDescription('');
    setPriority('');
    setDate('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Create Survey</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Site Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter site name"
            value={siteName}
            onChangeText={setSiteName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter client name"
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter description"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Priority (e.g., High, Medium, Low) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter priority"
            value={priority}
            onChangeText={setPriority}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
        </View>

        <Button title="Submit Survey" onPress={handleSubmit} color="#4CAF50" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  }
});
