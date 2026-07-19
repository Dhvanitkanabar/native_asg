import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      // Fetch existing users
      const usersStr = await AsyncStorage.getItem('@users');
      let users = usersStr ? JSON.parse(usersStr) : [];

      // Check if email already exists
      const userExists = users.some((u) => u.email === email.trim());
      if (userExists) {
        Alert.alert("Error", "An account with this email already exists.");
        return;
      }

      // Add new user
      users.push({ email: email.trim(), password });
      await AsyncStorage.setItem('@users', JSON.stringify(users));

      Alert.alert("Success", "Account created! You can now log in.", [
        { text: "OK", onPress: () => router.replace('/login') }
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to create account.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
          <Text style={styles.signupBtnText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.linkBtnText}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  signupBtn: {
    backgroundColor: '#34c759', // green color for signup
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signupBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
