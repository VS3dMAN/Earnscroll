import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Code, Database, Info, Trash2, Crown, RefreshCcw, X } from 'lucide-react-native';
import { useTimeBank } from '@/contexts/TimeBank';
import { useRouter, Stack } from 'expo-router';

export default function DeveloperMenuScreen() {
  const { generateMockWorkoutHistory, clearAllWorkoutHistory, toggleProStatus, isUserPro, resetOnboarding } = useTimeBank();
  const router = useRouter();

  const handlePopulate30Days = async () => {
    try {
      await generateMockWorkoutHistory(30);
      Alert.alert(
        'Success!',
        'Calendar populated with 30 days of mock workout data. Navigating to Dashboard...',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to generate mock data:', error);
      Alert.alert('Error', 'Failed to generate mock data. Please try again.');
    }
  };

  const handleClearHistory = async () => {
    try {
      if (Platform.OS === 'web') {
        const confirmed = typeof window !== 'undefined' ? window.confirm('This will permanently delete all your workout history and reset your streak to 0. This cannot be undone. Proceed?') : true;
        console.log('[DEV MENU] Clear history clicked (web) confirmed=', confirmed);
        if (!confirmed) return;
        await clearAllWorkoutHistory();
        if (typeof window !== 'undefined') {
          window.alert('All workout history has been deleted. Redirecting to Dashboard...');
        }
        router.push('/(tabs)');
        return;
      }

      Alert.alert(
        'Clear All Workout History?',
        'This will permanently delete all your workout history and reset your streak to 0. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('[DEV MENU] Clear history confirmed (native)');
                await clearAllWorkoutHistory();
                Alert.alert('Cleared!', 'All workout history has been deleted. Navigating to Dashboard...', [
                  { text: 'OK', onPress: () => router.push('/(tabs)') },
                ]);
              } catch (error) {
                console.error('Failed to clear history:', error);
                Alert.alert('Error', 'Failed to clear history. Please try again.');
              }
            },
          },
        ]
      );
    } catch (e) {
      console.error('Clear history error:', e);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Developer Menu',
          headerStyle: {
            backgroundColor: '#0F2027',
          },
          headerTintColor: '#00D9FF',
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
        }}
      />
      <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Code size={40} color="#00D9FF" />
            </View>
            <Text style={styles.headerTitle}>Developer Menu</Text>
            <Text style={styles.headerSubtitle}>Tools for testing and debugging</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Crown size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Pro Features Testing</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isUserPro && styles.primaryButtonActive]}
              onPress={async () => {
                const newStatus = await toggleProStatus();
                Alert.alert(
                  'Pro Status Toggled',
                  `You are now ${newStatus ? 'Pro' : 'Free'} user`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Crown size={24} color={isUserPro ? "#000" : "#fff"} />
              <Text style={[styles.primaryButtonText, isUserPro && styles.primaryButtonTextActive]}>
                {isUserPro ? 'Switch to Free User' : 'Switch to Pro User'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  const confirmed = typeof window !== 'undefined' ? window.confirm('This will reset onboarding and clear ALL data including Time Bank, Workout History, and Streak. You will be returned to the Welcome screen. Proceed?') : true;
                  if (!confirmed) return;
                  resetOnboarding();
                  if (typeof window !== 'undefined') {
                    window.alert('All data cleared. Redirecting to onboarding...');
                  }
                  router.replace('/onboarding');
                  return;
                }

                Alert.alert(
                  'Reset Onboarding & Clear All Data',
                  'This will reset onboarding and clear ALL data including Time Bank, Workout History, and Streak. You will be returned to the Welcome screen. This cannot be undone!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset Everything',
                      style: 'destructive',
                      onPress: async () => {
                        await resetOnboarding();
                        Alert.alert('Reset Complete', 'Redirecting to onboarding...', [
                          { text: 'OK', onPress: () => router.replace('/onboarding') },
                        ]);
                      },
                    },
                  ]
                );
              }}
            >
              <RefreshCcw size={24} color="#fff" />
              <Text style={styles.warningButtonText}>Reset Onboarding (Clear All Data)</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Info size={18} color="#00D9FF" />
                <Text style={styles.infoTitle}>Testing Tools:</Text>
              </View>
              <Text style={styles.infoText}>• Toggle Pro Status: Switch between Free and Pro user</Text>
              <Text style={styles.infoText}>• Reset Onboarding: Clear all data and return to Welcome screen</Text>
              <Text style={styles.infoText}>• Free users: 1 exercise, locked ratios, no calendar/stats</Text>
              <Text style={styles.infoText}>• Pro users: All exercises, custom ratios, full features</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Database size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Mock Data Generation</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handlePopulate30Days}>
              <Database size={24} color="#fff" />
              <Text style={styles.primaryButtonText}>Populate Calendar with 30 Days of Mock Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
              <Trash2 size={24} color="#fff" />
              <Text style={styles.dangerButtonText}>Clear All Workout History</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Info size={18} color="#00D9FF" />
                <Text style={styles.infoTitle}>What this does:</Text>
              </View>
              <Text style={styles.infoText}>• Clears any existing workout history</Text>
              <Text style={styles.infoText}>• Generates 30 days of random workout data</Text>
              <Text style={styles.infoText}>• Each day has ~70% chance of having a workout</Text>
              <Text style={styles.infoText}>• Random values:</Text>
              <Text style={styles.infoTextIndented}>- Squats: 10-60 reps</Text>
              <Text style={styles.infoTextIndented}>- Pushups: 5-35 reps</Text>
              <Text style={styles.infoTextIndented}>- Plank: 30-150 seconds</Text>
              <Text style={styles.infoText}>• Automatically updates your streak</Text>
              <Text style={styles.infoText}>• Takes you to Dashboard to see results</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Code size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Developer Mode</Text>
            </View>

            <TouchableOpacity
              style={styles.disableButton}
              onPress={async () => {
                if (Platform.OS === 'web') {
                  const confirmed = typeof window !== 'undefined' ? window.confirm('This will disable Developer Mode and hide all developer tools. You can re-enable it by tapping the version number 7 times in Settings.') : true;
                  if (!confirmed) return;
                  await AsyncStorage.setItem('@developer_mode', 'false');
                  if (typeof window !== 'undefined') {
                    window.alert('Developer Mode disabled. Returning to Settings...');
                  }
                  router.push('/settings');
                  return;
                }

                Alert.alert(
                  'Disable Developer Mode',
                  'This will hide all developer tools. You can re-enable it by tapping the version number 7 times in Settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Disable',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await AsyncStorage.setItem('@developer_mode', 'false');
                          Alert.alert('Developer Mode Disabled', 'Returning to Settings...', [
                            { text: 'OK', onPress: () => router.push('/settings') },
                          ]);
                        } catch (error) {
                          console.error('Failed to disable developer mode:', error);
                          Alert.alert('Error', 'Failed to disable developer mode. Please try again.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <X size={24} color="#fff" />
              <Text style={styles.disableButtonText}>Disable Developer Mode</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Info size={18} color="#00D9FF" />
                <Text style={styles.infoTitle}>Note:</Text>
              </View>
              <Text style={styles.infoText}>• Developer tools will be hidden from Dashboard and Settings</Text>
              <Text style={styles.infoText}>• To re-enable, tap the version number in Settings 7 times</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00D9FF',
    gap: 12,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  primaryButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  primaryButtonTextActive: {
    color: '#000',
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF9800',
    gap: 12,
    marginTop: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  warningButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F44336',
    gap: 12,
    marginTop: 16,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#00D9FF',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 8,
  },
  infoTextIndented: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 6,
    marginLeft: 16,
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    gap: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disableButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
});