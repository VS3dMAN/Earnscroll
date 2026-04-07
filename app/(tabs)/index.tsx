import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Modal, Platform } from "react-native";
import { Calendar, DateData } from 'react-native-calendars';
import { Zap, TrendingUp, Flame, ShieldAlert, X, Dumbbell, Activity, Crown, Lock, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimeBank, DailyWorkout } from '@/contexts/TimeBank';
import { useTheme } from '@/contexts/Theme';
import { cloudyGrey } from '@/constants/colors';

const CLOUDY_GREY_RGB = '224, 229, 238';
const cloudyGreyOpacity = (alpha: number): string => `rgba(${CLOUDY_GREY_RGB}, ${alpha})`;
const CLOUDY_GREY_70 = cloudyGreyOpacity(0.7);
const CLOUDY_GREY_60 = cloudyGreyOpacity(0.6);

export default function DashboardScreen() {
  const { earnedMinutes, isLoading, resetTimeBank, currentStreak, emergencyPausesRemaining, triggerEmergencyPause, workoutHistory, isUserPro, isDeveloperMode } = useTimeBank();
  const themeContext = useTheme();
  const theme = themeContext?.theme ?? {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    isDark: false,
  };
  const lockedOverlayColor = theme.isDark ? 'rgba(9, 14, 27, 0.92)' : 'rgba(255, 255, 255, 0.72)';
  const lockedIconHalo = theme.isDark ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 215, 0, 0.2)';
  const upgradeBadgeBackground = theme.isDark ? 'rgba(34, 211, 238, 0.16)' : '#FFD700';
  const upgradeBadgeTextColor = theme.isDark ? '#22D3EE' : '#000000';
  const statTileBackground = theme.isDark ? 'rgba(255, 255, 255, 0.04)' : '#f4f5f6';
  const statTileBorder = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const insets = useSafeAreaInsets();
  const scrollPaddingTop = insets.top + (Platform.OS === 'ios' ? 32 : Platform.OS === 'android' ? 24 : 20);
  const scrollPaddingBottom = insets.bottom + 120;
  const router = useRouter();
  const [isUsingEmergency, setIsUsingEmergency] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEmergencySheetVisible, setIsEmergencySheetVisible] = useState<boolean>(false);
  const calendarKey = useMemo(() => `cal-${Object.keys(workoutHistory).length}-${Object.keys(workoutHistory)[0] ?? 'empty'}`,[workoutHistory]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', emoji: '☀️' };
    } else if (hour >= 12 && hour < 18) {
      return { text: 'Good Afternoon', emoji: '🌤️' };
    } else {
      return { text: 'Good Evening', emoji: '🌙' };
    }
  };

  const handleEmergencyAccess = async () => {
    if (isUsingEmergency) return;

    setIsUsingEmergency(true);
    try {
      const result = await triggerEmergencyPause();
      if (result.success) {
        Alert.alert('Emergency Access Granted', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Unable to Use Emergency Access', result.message, [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error using emergency pause:', error);
      Alert.alert('Error', 'Failed to use emergency access. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsUsingEmergency(false);
    }
  };

  const markedDates = useMemo(() => {
    const marked: { [date: string]: { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string } } = {};
    
    Object.keys(workoutHistory).forEach(date => {
      marked[date] = {
        marked: true,
        dotColor: '#00D9FF',
      };
    });

    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: 'rgba(0, 217, 255, 0.3)',
      };
    }

    return marked;
  }, [workoutHistory, selectedDate]);

  const allTimeStats = useMemo(() => {
    let totalSquats = 0;
    let totalPushups = 0;
    let totalPlankSeconds = 0;
    let totalWorkoutDays = 0;

    Object.values(workoutHistory).forEach((day: DailyWorkout) => {
      totalSquats += day.squats;
      totalPushups += day.pushups;
      totalPlankSeconds += day.plank;
      totalWorkoutDays++;
    });

    return {
      totalSquats,
      totalPushups,
      totalPlankSeconds,
      totalWorkoutDays,
    };
  }, [workoutHistory]);

  const selectedDayWorkout = selectedDate ? workoutHistory[selectedDate] : null;

  const handleDayPress = (day: DateData) => {
    if (workoutHistory[day.dateString]) {
      setSelectedDate(day.dateString);
    }
  };

  if (isLoading || !themeContext?.isHydrated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading your time bank...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: scrollPaddingTop, paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
        testID="dashboard-scroll"
      >
          <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.greetingContainer}>
            <Text 
              style={[styles.headerTitle, { color: theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {getTimeBasedGreeting().text}
            </Text>
            <Text style={styles.greetingEmoji}>{getTimeBasedGreeting().emoji}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[
                styles.emergencyShieldButton,
                { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
              ]}
              onPress={() => setIsEmergencySheetVisible(true)}
              activeOpacity={0.6}
              testID="dashboard-emergency-button"
            >
              <ShieldAlert 
                size={20} 
                color={(__DEV__ || emergencyPausesRemaining > 0) ? (theme.isDark ? "#94A3B8" : "#64748B") : "#EF4444"} 
                strokeWidth={2}
              />
              {(__DEV__ || emergencyPausesRemaining > 0) && (
                <View style={[
                  styles.emergencyIndicatorDot,
                  { borderColor: theme.card }
                ]} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingsButton,
                { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)' }
              ]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
              testID="dashboard-settings-button"
            >
              <Settings size={20} color={theme.isDark ? '#CBD5F5' : '#1E293B'} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Ready to earn some screen time?</Text>
      </View>

      <View style={[styles.mainCard, { backgroundColor: theme.card }]}>
        <View style={styles.cardGlow} />
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeValue, earnedMinutes === 0 && styles.timeValueZeroState]}>
            {earnedMinutes === 0 ? 'Ready' : formatTime(earnedMinutes)}
          </Text>
          <Text style={styles.timeLabel}>{earnedMinutes === 0 ? 'to Earn' : 'Total Earned'}</Text>
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Zap size={20} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.text }]}>{earnedMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <TrendingUp size={20} color="#4CAF50" />
            <Text style={[styles.statValue, { color: theme.text }]}>{Math.floor(earnedMinutes / 60)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>
      </View>

      <View style={[styles.streakCard, { backgroundColor: theme.card }]}>
        <View style={styles.streakIcon}>
          <Flame size={28} color={currentStreak > 0 ? "#FF6B35" : "#666"} />
        </View>
        <View style={styles.streakContent}>
          <Text style={[styles.streakValue, { color: theme.text }]}>
            {currentStreak === 0 ? 'Ignite' : `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
            {currentStreak === 0 ? 'Your Streak' : 'Current Streak'}
          </Text>
        </View>
        {currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
          </View>
        )}
      </View>

      {isUserPro ? (
        <View style={[styles.calendarCard, { backgroundColor: theme.card }]}>
          <View style={styles.calendarHeader}>
            <Activity size={24} color="#00D9FF" />
            <Text style={[styles.calendarTitle, { color: theme.text }]}>Workout Calendar</Text>
          </View>
          <Calendar
            key={`${calendarKey}-${theme.isDark ? 'dark' : 'light'}`}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              calendarBackground: theme.isDark ? '#1E293B' : '#ffffff',
              textSectionTitleColor: theme.isDark ? '#94A3B8' : '#b6c1cd',
              selectedDayBackgroundColor: '#49cbeb',
              selectedDayTextColor: theme.isDark ? '#0F172A' : '#2d4150',
              todayTextColor: '#22D3EE',
              dayTextColor: theme.isDark ? cloudyGrey : '#2d4150',
              textDisabledColor: theme.isDark ? '#475569' : '#d9e1e8',
              dotColor: '#49cbeb',
              selectedDotColor: theme.isDark ? '#0F172A' : '#ffffff',
              arrowColor: '#22D3EE',
              monthTextColor: theme.isDark ? cloudyGrey : '#2d4150',
              indicatorColor: '#49cbeb',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12,
            }}
          />
          {Object.keys(workoutHistory).length === 0 && (
            <View style={styles.emptyCalendarMessage}>
              <Dumbbell size={32} color={theme.isDark ? '#94A3B8' : '#475569'} />
              <Text
                style={[
                  styles.emptyCalendarText,
                  { color: theme.isDark ? CLOUDY_GREY_70 : theme.textSecondary },
                ]}
                testID="dashboard-empty-calendar-text"
              >
                Start working out to see your progress!
              </Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.calendarCardLocked, { backgroundColor: theme.card }]}
          onPress={() => router.push('/go-pro')}
          activeOpacity={0.7}
        >
          <View style={styles.mockCalendarGrid}>
            {Array.from({ length: 28 }).map((_, i) => (
              <View key={i} style={[styles.mockCalendarDay, { backgroundColor: theme.isDark ? '#334155' : '#E2E8F0' }]} />
            ))}
          </View>
          <View style={[styles.lockedBlurOverlay, { backgroundColor: lockedOverlayColor }]} />
          <View style={styles.lockedOverlay}>
            <View style={[styles.lockedIconContainer, { backgroundColor: lockedIconHalo }]}>
              <Lock size={40} color="#FFD700" />
            </View>
            <Text style={[styles.lockedTitle, { color: theme.text }]}>Workout Calendar</Text>
            <Text style={[styles.lockedSubtitle, { color: theme.textSecondary }]}>
              Track your complete workout history with Pro
            </Text>
            <View style={[styles.upgradeProBadge, { backgroundColor: upgradeBadgeBackground, borderColor: theme.isDark ? 'rgba(34, 211, 238, 0.4)' : 'transparent' }]}>
              <Crown size={16} color={theme.isDark ? '#22D3EE' : '#000'} />
              <Text style={[styles.upgradeProBadgeText, { color: upgradeBadgeTextColor }]}>Upgrade to Pro</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {isUserPro ? (
        <View style={[styles.allTimeStatsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.allTimeStatsTitle, { color: theme.text }]}>All-Time Stats</Text>
          <View style={styles.allTimeStatsGrid}>
            <View style={[styles.allTimeStatItem, { backgroundColor: statTileBackground, borderColor: statTileBorder }]}>
              <Text style={[styles.allTimeStatValue, { color: theme.isDark ? '#22D3EE' : '#0284C7' }]}>
                {allTimeStats.totalSquats === 0 ? '-' : allTimeStats.totalSquats}
              </Text>
              <Text style={[styles.allTimeStatLabel, { color: theme.textSecondary }]}>Total Squats</Text>
            </View>
            <View style={[styles.allTimeStatItem, { backgroundColor: statTileBackground, borderColor: statTileBorder }]}>
              <Text style={[styles.allTimeStatValue, { color: theme.isDark ? '#22D3EE' : '#0284C7' }]}>
                {allTimeStats.totalPushups === 0 ? '-' : allTimeStats.totalPushups}
              </Text>
              <Text style={[styles.allTimeStatLabel, { color: theme.textSecondary }]}>Total Pushups</Text>
            </View>
            <View style={[styles.allTimeStatItem, { backgroundColor: statTileBackground, borderColor: statTileBorder }]}>
              <Text style={[styles.allTimeStatValue, { color: theme.isDark ? '#22D3EE' : '#0284C7' }]}>
                {allTimeStats.totalPlankSeconds === 0 ? '—' : `${Math.floor(allTimeStats.totalPlankSeconds / 60)}m ${allTimeStats.totalPlankSeconds % 60}s`}
              </Text>
              <Text style={[styles.allTimeStatLabel, { color: theme.textSecondary }]}>Total Plank</Text>
            </View>
            <View style={[styles.allTimeStatItem, { backgroundColor: statTileBackground, borderColor: statTileBorder }]}>
              <Text style={[styles.allTimeStatValue, { color: theme.isDark ? '#22D3EE' : '#0284C7' }]}>
                {allTimeStats.totalWorkoutDays === 0 ? '—' : allTimeStats.totalWorkoutDays}
              </Text>
              <Text style={[styles.allTimeStatLabel, { color: theme.textSecondary }]}>Workout Days</Text>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.allTimeStatsCardLocked, { backgroundColor: theme.card }]}
          onPress={() => router.push('/go-pro')}
          activeOpacity={0.7}
        >
          <View style={styles.mockStatsChart}>
            {[45, 70, 55, 80, 60, 90, 65].map((height, i) => (
              <View key={i} style={[styles.mockStatsBar, { height: `${height}%`, backgroundColor: theme.isDark ? '#334155' : '#E2E8F0' }]} />
            ))}
          </View>
          <View style={[styles.lockedBlurOverlay, { backgroundColor: lockedOverlayColor }]} />
          <View style={styles.lockedStatsOverlay}>
            <View style={[styles.lockedIconContainer, { backgroundColor: lockedIconHalo }]}>
              <TrendingUp size={36} color="#FFD700" />
            </View>
            <Text style={[styles.lockedTitle, { color: theme.text }]}>All-Time Stats</Text>
            <Text style={[styles.lockedSubtitle, { color: theme.textSecondary }]}>
              View comprehensive performance analytics with Pro
            </Text>
            <View style={[styles.upgradeProBadge, { backgroundColor: upgradeBadgeBackground, borderColor: theme.isDark ? 'rgba(34, 211, 238, 0.4)' : 'transparent' }]}>
              <Crown size={16} color={theme.isDark ? '#22D3EE' : '#000'} />
              <Text style={[styles.upgradeProBadgeText, { color: upgradeBadgeTextColor }]}>Upgrade to Pro</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {isDeveloperMode && (
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetTimeBank}
        >
          <Text style={styles.resetButtonText}>Reset Time Bank (Dev Only)</Text>
        </TouchableOpacity>
      )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedDate && selectedDayWorkout)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedDate(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedDate(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <X size={24} color={cloudyGrey} />
              </TouchableOpacity>
            </View>
            {selectedDayWorkout && (
              <View style={styles.modalBody}>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Squats:</Text>
                  <Text style={styles.modalStatValue}>{selectedDayWorkout.squats}</Text>
                </View>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Pushups:</Text>
                  <Text style={styles.modalStatValue}>{selectedDayWorkout.pushups}</Text>
                </View>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>Plank:</Text>
                  <Text style={styles.modalStatValue}>
                    {Math.floor(selectedDayWorkout.plank / 60)}m {selectedDayWorkout.plank % 60}s
                  </Text>
                </View>
                {(selectedDayWorkout.squats === 0 && selectedDayWorkout.pushups === 0 && selectedDayWorkout.plank === 0) && (
                  <Text style={styles.modalEmptyText}>No exercises recorded this day</Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isEmergencySheetVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEmergencySheetVisible(false)}
      >
        <TouchableOpacity 
          style={styles.emergencyModalOverlay}
          activeOpacity={1}
          onPress={() => setIsEmergencySheetVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.emergencySheet, { backgroundColor: theme.card }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.emergencySheetHandle} />
            
            <View style={styles.emergencySheetHeader}>
              <View style={styles.emergencySheetIconContainer}>
                <ShieldAlert size={32} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={[styles.emergencySheetTitle, { color: theme.text }]}>Emergency Access</Text>
              <Text style={[styles.emergencySheetSubtext, { color: theme.textSecondary }]}>
                {isDeveloperMode
                  ? 'Unlimited uses in development mode'
                  : emergencyPausesRemaining > 0
                    ? `${emergencyPausesRemaining} use${emergencyPausesRemaining === 1 ? '' : 's'} remaining today`
                    : 'No uses remaining today'}
              </Text>
            </View>

            <View style={styles.emergencySheetBody}>
              <View style={styles.emergencyInfoBox}>
                <Text style={[styles.emergencyInfoText, { color: theme.textSecondary }]}>
                  Emergency access grants you 5 minutes of screen time when you need it most. Use wisely!
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.emergencyUseButton,
                  (!__DEV__ && emergencyPausesRemaining === 0) && styles.emergencyUseButtonDisabled
                ]}
                onPress={async () => {
                  await handleEmergencyAccess();
                  setIsEmergencySheetVisible(false);
                }}
                disabled={isUsingEmergency || (!__DEV__ && emergencyPausesRemaining === 0)}
                activeOpacity={0.8}
              >
                <Text style={styles.emergencyUseButtonText}>
                  {isUsingEmergency ? 'Granting Access...' : 'Use 5 Minute Ticket'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emergencyCancelButton}
                onPress={() => setIsEmergencySheetVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.emergencyCancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f4f5f6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'nowrap' as const,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greetingEmoji: {
    fontSize: 26,
    marginLeft: 8,
    lineHeight: 32,
    flexShrink: 0,
  },
  emergencyShieldButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
    flexShrink: 0,
  },
  emergencyIndicatorDot: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#1a1a1a',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    lineHeight: 22,
    marginTop: 4,
  },
  mainCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  cardGlow: {
    position: 'absolute' as const,
    top: -50,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: '#49cbeb',
    opacity: 0.15,
    borderRadius: 100,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 1,
  },
  timeValue: {
    fontSize: 72,
    fontFamily: 'SpaceMono_700Bold',
    color: '#49cbeb',
  },
  timeValueZeroState: {
    fontSize: 64,
  },
  timeLabel: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'SpaceMono_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#e0e0e0',
  },
  streakCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00e00020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakContent: {
    flex: 1,
  },
  streakValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  streakBadge: {
    backgroundColor: '#00e00030',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  streakEmoji: {
    fontSize: 24,
  },
  calendarCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  emptyCalendarMessage: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyCalendarText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: CLOUDY_GREY_70,
    textAlign: 'center',
  },
  allTimeStatsCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  allTimeStatsTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  allTimeStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  allTimeStatItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  allTimeStatValue: {
    fontSize: 24,
    fontFamily: 'SpaceMono_700Bold',
    marginBottom: 8,
  },
  allTimeStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#666',
    textAlign: 'center',
  },
  calendarCardLocked: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 200,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  mockCalendarGrid: {
    position: 'absolute' as const,
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  mockCalendarDay: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  lockedBlurOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  allTimeStatsCardLocked: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 180,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  mockStatsChart: {
    position: 'absolute' as const,
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
  },
  mockStatsBar: {
    flex: 1,
    borderRadius: 6,
    minHeight: 30,
  },
  lockedOverlay: {
    position: 'relative' as const,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedStatsOverlay: {
    position: 'relative' as const,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  upgradeProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  upgradeProBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginTop: 16,
  },
  resetButton: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  emergencyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emergencySheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  emergencySheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  emergencySheetHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  emergencySheetIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencySheetTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  emergencySheetSubtext: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  emergencySheetBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emergencyInfoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  emergencyInfoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
  emergencyUseButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyUseButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  emergencyUseButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  emergencyCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emergencyCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00D9FF',
    flex: 1,
  },
  modalBody: {
    gap: 16,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  modalStatLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: CLOUDY_GREY_70,
  },
  modalStatValue: {
    fontSize: 18,
    fontFamily: 'SpaceMono_700Bold',
    color: '#fff',
  },
  modalEmptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: CLOUDY_GREY_60,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
