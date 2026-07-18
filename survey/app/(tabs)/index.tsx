import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleNewSurvey = () => {
    router.push('/(tabs)/survey');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Custom App Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerGreeting, { color: theme.icon }]}>Good Morning,</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Dhvanit</Text>
        </View>
        <Pressable style={styles.profileBadge}>
          <Image source={require('@/assets/images/avatar.jpeg')} style={styles.avatar} />
          <View style={[styles.activeIndicator, { borderColor: theme.background }]} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Screen & Student Details */}
        <View style={[styles.welcomeCard, { backgroundColor: theme.tint }]}>
          <View style={styles.welcomeTextContent}>
            <Text style={styles.welcomeCardTitle}>Smart Field Survey</Text>
            <Text style={styles.welcomeCardSubtitle}>ID: STD-2026-X1 • Field Agent</Text>
          </View>
          <MaterialIcons name="radar" size={48} color="rgba(255,255,255,0.2)" style={styles.welcomeIconBg} />
        </View>

        {/* Today's Survey Count */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.background, shadowColor: theme.text }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <MaterialIcons name="assignment-turned-in" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>12</Text>
            <Text style={[styles.statTitle, { color: theme.icon }]}>Today's Surveys</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.background, shadowColor: theme.text }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
              <MaterialIcons name="pending-actions" size={24} color="#2196F3" />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>3</Text>
            <Text style={[styles.statTitle, { color: theme.icon }]}>Pending</Text>
          </View>
        </View>

        {/* Quick Action Cards */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.quickActions}>
          <Pressable style={[styles.actionCard, { backgroundColor: theme.background, shadowColor: theme.text }]} onPress={handleNewSurvey}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#4CAF5015' }]}>
              <MaterialIcons name="add-task" size={28} color="#4CAF50" />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>New Survey</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, { backgroundColor: theme.background, shadowColor: theme.text }]} onPress={() => router.push('/(tabs)/camera')}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#2196F315' }]}>
              <MaterialIcons name="camera-alt" size={28} color="#2196F3" />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Take Photo</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, { backgroundColor: theme.background, shadowColor: theme.text }]} onPress={() => router.push('/(tabs)/history')}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#FF980015' }]}>
              <MaterialIcons name="history" size={28} color="#FF9800" />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>History</Text>
          </Pressable>
        </View>

        {/* Recent Survey Summary */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Surveys</Text>
          <Pressable>
            <Text style={[styles.seeAllText, { color: theme.tint }]}>See All</Text>
          </Pressable>
        </View>
        {[
          { id: 1, title: 'Downtown Office', client: 'Acme Corp', status: 'Done', color: '#4CAF50', icon: 'check-circle' },
          { id: 2, title: 'Central Park Plaza', client: 'City Council', status: 'In Progress', color: '#FF9800', icon: 'sync' },
          { id: 3, title: 'Westside Mall', client: 'Retail Group', status: 'Pending', color: '#F44336', icon: 'schedule' }
        ].map((item) => (
          <View key={item.id} style={[styles.recentCard, { backgroundColor: theme.background, shadowColor: theme.text }]}>
            <View style={[styles.recentIconContainer, { backgroundColor: item.color + '15' }]}>
              <MaterialIcons name="location-city" size={24} color={item.color} />
            </View>
            <View style={styles.recentInfo}>
              <Text style={[styles.recentTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.recentSub, { color: theme.icon }]}>{item.client}</Text>
            </View>
            <View style={styles.recentStatus}>
              <MaterialIcons name={item.icon as any} size={16} color={item.color} />
              <Text style={[styles.statusText, { color: item.color }]}>{item.status}</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.bottomPadding} />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileBadge: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  welcomeCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  welcomeTextContent: {
    zIndex: 2,
  },
  welcomeCardTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeCardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeIconBg: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ scale: 2.5 }],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  actionIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  recentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentSub: {
    fontSize: 13,
  },
  recentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bottomPadding: {
    height: 40,
  }
});
