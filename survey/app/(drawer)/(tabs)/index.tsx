import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Pressable, Image, 
  Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Layers, TrendingUp, Plus, Camera, History, MapPin, 
  Users, ChevronRight, Activity, CalendarDays, BarChart4, PieChart as PieIcon 
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AppCard } from '@/components/ui/AppCard';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton } from '@/components/ui/AppButton';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ---- Pure RN Bar Chart ----
function SimpleBarChart({ data, labels, barColor, labelColor }: any) {
  const maxVal = Math.max(...data, 1);
  return (
    <View style={barStyles.container}>
      <View style={barStyles.barsRow}>
        {data.map((val: number, i: number) => {
          const heightPct = (val / maxVal) * 100;
          return (
            <View key={i} style={barStyles.barColumn}>
              {val > 0 && (
                <Text style={[barStyles.barValue, { color: barColor, fontFamily: Typography.fontFamily.bold }]}>{val}</Text>
              )}
              <View style={[barStyles.barTrack, { backgroundColor: barColor + '10' }]}>
                <View style={[
                  barStyles.barFill, 
                  { height: `${Math.max(heightPct, 5)}%`, backgroundColor: val > 0 ? barColor : (barColor + '20') }
                ]} />
              </View>
              <Text style={[barStyles.barLabel, { color: labelColor, fontFamily: Typography.fontFamily.medium }]}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { paddingTop: Spacing.sm },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: Spacing.sm },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: Typography.fontSize.xs, marginBottom: Spacing.xs },
  barTrack: { width: '45%', height: '70%', justifyContent: 'flex-end', borderRadius: Radius.xs, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: Radius.xs, minHeight: 4 },
  barLabel: { fontSize: Typography.fontSize.xs, marginTop: Spacing.sm },
});

// ---- Pure RN Donut Chart ----
function SimpleDonutChart({ data, theme }: any) {
  const total = data.reduce((sum: number, d: any) => sum + d.count, 0);
  if (total === 0) return null;

  return (
    <View style={donutStyles.container}>
      <View style={donutStyles.left}>
        <View style={donutStyles.centerStat}>
          <Text style={[donutStyles.centerValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{total}</Text>
          <Text style={[donutStyles.centerLabel, { color: theme.textSecondary, fontFamily: Typography.fontFamily.semiBold }]}>Total Reports</Text>
        </View>
        <View style={[donutStyles.ringContainer, { backgroundColor: theme.borderLight }]}>
          {data.map((d: any, i: number) => (
            <View 
              key={i} 
              style={[
                donutStyles.ringSegment, 
                { 
                  flex: d.count, 
                  backgroundColor: d.color,
                  borderTopLeftRadius: i === 0 ? Radius.sm : 0,
                  borderBottomLeftRadius: i === 0 ? Radius.sm : 0,
                  borderTopRightRadius: i === data.length - 1 ? Radius.sm : 0,
                  borderBottomRightRadius: i === data.length - 1 ? Radius.sm : 0,
                }
              ]} 
            />
          ))}
        </View>
      </View>
      <View style={donutStyles.legend}>
        {data.map((d: any, i: number) => (
          <View key={i} style={donutStyles.legendItem}>
            <View style={[donutStyles.legendDot, { backgroundColor: d.color }]} />
            <Text style={[donutStyles.legendName, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]} numberOfLines={1}>{d.name}</Text>
            <Text style={[donutStyles.legendCount, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>{d.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  left: { flex: 1 },
  centerStat: { alignItems: 'center', marginBottom: Spacing.md },
  centerValue: { fontSize: Typography.fontSize.h1 },
  centerLabel: { fontSize: Typography.fontSize.xs, marginTop: Spacing.xs },
  ringContainer: { flexDirection: 'row', height: 12, borderRadius: Radius.full, overflow: 'hidden' },
  ringSegment: { height: '100%' },
  legend: { gap: Spacing.sm, minWidth: 100 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: Radius.full },
  legendName: { fontSize: Typography.fontSize.sm, flex: 1 },
  legendCount: { fontSize: Typography.fontSize.sm },
});

// ================================================================

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [profile, setProfile] = useState({ name: 'User', photoUri: null });
  const [surveys, setSurveys] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const [profileData, historyData] = await Promise.all([
            AsyncStorage.getItem('@user_profile'),
            AsyncStorage.getItem('@surveys_history'),
          ]);
          if (profileData) setProfile(JSON.parse(profileData));
          if (historyData) setSurveys(JSON.parse(historyData));
        } catch (e) { console.log(e); }
      };
      loadData();
    }, [])
  );

  // --- Computed Stats ---
  const totalSurveys = surveys.length;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todaySurveys = surveys.filter((s: any) => s.dateString === todayStr).length;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeekSurveys = surveys.filter((s: any) => {
    const d = new Date(s.submittedAt || s.dateString);
    return d >= startOfWeek;
  }).length;

  const priorityCounts: any = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  surveys.forEach((s: any) => {
    if (priorityCounts[s.priority] !== undefined) priorityCounts[s.priority]++;
  });

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    last7Days.push({
      label: dayNames[d.getDay()],
      count: surveys.filter((s: any) => s.dateString === ds).length,
    });
  }

  const pieData = [
    { name: 'Low', count: priorityCounts.Low, color: theme.success },
    { name: 'Medium', count: priorityCounts.Medium, color: theme.warning },
    { name: 'High', count: '#F97316' },
    { name: 'Critical', count: priorityCounts.Critical, color: theme.danger },
  ].filter(p => p.count > 0);

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const recentSurveys = surveys.slice(0, 4);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Low': return theme.success;
      case 'Medium': return theme.warning;
      case 'High': return '#F97316';
      case 'Critical': return theme.danger;
      default: return theme.textTertiary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerGreeting, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]} numberOfLines={1}>
            {profile.name || 'Agent'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/(drawer)/(tabs)/profile')}>
          <AppAvatar 
            photoUri={profile.photoUri} 
            name={profile.name || 'U'} 
            size={48} 
            showIndicator 
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Modern Welcome Banner */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeTextContent}>
              <Text style={[styles.welcomeCardTitle, { fontFamily: Typography.fontFamily.black }]}>Inspection Operations</Text>
              <Text style={[styles.welcomeCardSubtitle, { fontFamily: Typography.fontFamily.semiBold }]}>ID: STD-2026-X1 • Field Agent</Text>
            </View>
            <View style={styles.welcomeIconBg}>
              <Activity size={80} color="rgba(255,255,255,0.15)" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
          <AppCard variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.primary + '12' }]}>
              <Layers size={20} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{totalSurveys}</Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>Total</Text>
          </AppCard>

          <AppCard variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.success + '12' }]}>
              <CalendarDays size={20} color={theme.success} />
            </View>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{todaySurveys}</Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>Today</Text>
          </AppCard>

          <AppCard variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.accent + '12' }]}>
              <TrendingUp size={20} color={theme.accent} />
            </View>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: Typography.fontFamily.black }]}>{thisWeekSurveys}</Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>This Week</Text>
          </AppCard>
        </Animated.View>

        {/* Bar Chart Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppCard variant="elevated" style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <BarChart4 size={18} color={theme.primary} />
              <Text style={[styles.chartTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Weekly Activity</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: theme.primary + '12' }]}>
              <Text style={[styles.chartBadgeText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>Last 7 Days</Text>
            </View>
          </View>
          {totalSurveys > 0 ? (
            <SimpleBarChart
              data={last7Days.map(d => d.count)}
              labels={last7Days.map(d => d.label)}
              barColor={theme.primary}
              labelColor={theme.textSecondary}
            />
          ) : (
            <View style={styles.emptyChart}>
              <BarChart4 size={36} color={theme.border} />
              <Text style={[styles.emptyChartText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
                Submit surveys to see your activity
              </Text>
            </View>
          )}
        </AppCard>
        </Animated.View>

        {/* Pie Chart Card */}
        {pieData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <AppCard variant="elevated" style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartTitleRow}>
                  <PieIcon size={18} color={theme.accent} />
                  <Text style={[styles.chartTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Priority Breakdown</Text>
                </View>
              </View>
              <SimpleDonutChart data={pieData} theme={theme} />
            </AppCard>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            {[
              { icon: <Plus size={22} color={theme.success} />, label: 'New Survey', bg: theme.success + '10', onPress: () => router.push('/(drawer)/survey') },
              { icon: <Camera size={22} color={theme.primary} />, label: 'Camera', bg: theme.primary + '10', onPress: () => router.push('/(drawer)/camera') },
              { icon: <History size={22} color={theme.warning} />, label: 'History', bg: theme.warning + '10', onPress: () => router.push('/(drawer)/(tabs)/history') },
              { icon: <MapPin size={22} color={theme.accent} />, label: 'Location', bg: theme.accent + '10', onPress: () => router.push('/(drawer)/location') },
              { icon: <Users size={22} color="#EC4899" />, label: 'Contacts', bg: '#EC489910', onPress: () => router.push('/(drawer)/contacts') },
            ].map((action, i) => (
              <Pressable 
                key={i} 
                style={[styles.actionCard, { backgroundColor: theme.surfaceElevated }, Shadows.sm]}
                onPress={action.onPress}
              >
                <View style={[styles.actionIconWrapper, { backgroundColor: action.bg }]}>
                  {action.icon}
                </View>
                <Text style={[styles.actionText, { color: theme.text, fontFamily: Typography.fontFamily.semiBold }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]}>Recent Surveys</Text>
            <Pressable onPress={() => router.push('/(drawer)/(tabs)/history')} style={styles.seeAllBtn}>
              <Text style={[styles.seeAllText, { color: theme.primary, fontFamily: Typography.fontFamily.bold }]}>See All</Text>
              <ChevronRight size={16} color={theme.primary} />
            </Pressable>
          </View>
          
          {recentSurveys.length > 0 ? recentSurveys.map((item: any, i) => (
            <AppCard key={item.id || i} style={styles.recentCard}>
              <View style={styles.recentRow}>
                {(item.photos?.[0] || item.photoUri) ? (
                  <Image source={{ uri: item.photos?.[0] || item.photoUri }} style={styles.recentThumb} />
                ) : (
                  <View style={[styles.recentThumbPlaceholder, { backgroundColor: getPriorityColor(item.priority) + '12' }]}>
                    <MapPin size={20} color={getPriorityColor(item.priority)} />
                  </View>
                )}
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentTitle, { color: theme.text, fontFamily: Typography.fontFamily.bold }]} numberOfLines={1}>{item.siteName}</Text>
                  <Text style={[styles.recentSub, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]} numberOfLines={1}>{item.clientName}</Text>
                </View>
                <AppBadge label={item.priority} color={getPriorityColor(item.priority)} />
              </View>
            </AppCard>
          )) : (
            <AppCard style={styles.emptyRecent}>
              <CalendarDays size={32} color={theme.border} />
              <Text style={[styles.emptyRecentText, { color: theme.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
                No surveys yet. Create your first one!
              </Text>
            </AppCard>
          )}
        </Animated.View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  headerTitleContainer: { flex: 1 },
  headerGreeting: { fontSize: Typography.fontSize.sm, marginBottom: Spacing.xs },
  headerTitle: { fontSize: Typography.fontSize.xxl, letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },

  // Welcome Card
  welcomeCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  welcomeTextContent: { zIndex: 2, flex: 1 },
  welcomeCardTitle: { color: '#fff', fontSize: Typography.fontSize.xl, marginBottom: Spacing.xs, letterSpacing: -0.3 },
  welcomeCardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.fontSize.sm },
  welcomeIconBg: { position: 'absolute', right: 10, bottom: -10 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: { fontSize: Typography.fontSize.xl, marginBottom: 2 },
  statTitle: { fontSize: Typography.fontSize.xs },

  // Charts
  chartCard: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chartTitle: { fontSize: Typography.fontSize.md },
  chartBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.xs },
  chartBadgeText: { fontSize: Typography.fontSize.xs },
  emptyChart: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyChartText: { fontSize: Typography.fontSize.sm },

  // Quick Actions
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.fontSize.lg },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  seeAllText: { fontSize: Typography.fontSize.sm },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    flexGrow: 1,
  },
  actionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: { fontSize: Typography.fontSize.xs },

  // Recent Activity
  recentCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  recentThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  recentThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: Typography.fontSize.sm + 1, marginBottom: 2 },
  recentSub: { fontSize: Typography.fontSize.xs },
  emptyRecent: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  emptyRecentText: { fontSize: Typography.fontSize.sm, textAlign: 'center' },
  bottomPadding: { height: 120 },
});
