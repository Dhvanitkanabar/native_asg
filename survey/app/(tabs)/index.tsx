import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Custom App Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Smart Survey</Text>
        </View>
        <Image source={require('../../assets/images/avatar.jpeg')} style={styles.avatar} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Screen & Student Details */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>Welcome back,</Text>
          <Text style={[styles.studentName, { color: theme.tint }]}>Dhvanit Kanabar</Text>
          <Text style={[styles.studentDetail, { color: theme.icon }]}>ID: STD-2026-X1 | Field Agent</Text>
        </View>

        {/* Today's Survey Count */}
        <View style={[styles.statCard, { backgroundColor: theme.tint + '10', borderColor: theme.tint }]}>
          <View>
            <Text style={[styles.statTitle, { color: theme.text }]}>Today's Surveys</Text>
            <Text style={[styles.statValue, { color: theme.tint }]}>12</Text>
          </View>
          <MaterialIcons name="assignment-turned-in" size={48} color={theme.tint} />
        </View>

        {/* Quick Action Cards */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Pressable style={[styles.actionCard, { backgroundColor: '#4CAF5015' }]}>
            <MaterialIcons name="add-task" size={32} color="#4CAF50" />
            <Text style={[styles.actionText, { color: theme.text }]}>New Survey</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, { backgroundColor: '#2196F315' }]}>
            <MaterialIcons name="camera-alt" size={32} color="#2196F3" />
            <Text style={[styles.actionText, { color: theme.text }]}>Take Photo</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, { backgroundColor: '#FF980015' }]}>
            <MaterialIcons name="history" size={32} color="#FF9800" />
            <Text style={[styles.actionText, { color: theme.text }]}>History</Text>
          </Pressable>
        </View>

        {/* Recent Survey Summary */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Recent Surveys</Text>
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.recentCard, { backgroundColor: theme.background, borderColor: theme.icon + '40' }]}>
            <View style={styles.recentInfo}>
              <Text style={[styles.recentTitle, { color: theme.text }]}>Site Inspection #{item}</Text>
              <Text style={[styles.recentSub, { color: theme.icon }]}>Client: Acme Corp</Text>
            </View>
            <View style={styles.recentStatus}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.statusText}>Done</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 16,
  },
  studentName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  studentDetail: {
    fontSize: 14,
    marginTop: 5,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 25,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentSub: {
    fontSize: 14,
    marginTop: 4,
  },
  recentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 5,
  }
});
