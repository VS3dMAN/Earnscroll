import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, Activity, Timer, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimeBank, FREE_LAUNCH_MODE } from '@/contexts/TimeBank';
import { useAnalytics } from '@/contexts/Analytics';
import { colors } from '@/constants/colors';

type ExerciseOption = 'squats' | 'pushups' | 'planks';

export default function OnboardingScreen() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);
  const { completeOnboarding } = useTimeBank();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const autoCompletedRef = useRef(false);

  useEffect(() => {
    if (FREE_LAUNCH_MODE && !autoCompletedRef.current) {
      autoCompletedRef.current = true;
      (async () => {
        await completeOnboarding();
        router.replace('/(tabs)');
      })();
    }
  }, [completeOnboarding, router]);

  if (FREE_LAUNCH_MODE) return null;

  const handleExerciseSelect = (exercise: ExerciseOption) => {
    setSelectedExercise(exercise);
  };

  const handleContinue = () => {
    if (!selectedExercise) return;

    const exerciseName = selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1);

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(`You chose "${exerciseName}" as your free exercise. You can switch it later from Settings. Continue?`)
        : true;
      if (!confirmed) return;
      trackEvent('onboarding_completed', { selected_exercise: selectedExercise });
      completeOnboarding(selectedExercise);
      router.replace('/(tabs)');
      return;
    }

    Alert.alert(
      'Confirm Your Choice',
      `You chose "${exerciseName}" as your free exercise. You can switch your free exercise later from Settings.`,
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            trackEvent('onboarding_completed', { selected_exercise: selectedExercise });
            await completeOnboarding(selectedExercise);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const exercises = [
    {
      id: 'squats' as ExerciseOption,
      icon: Activity,
      title: 'Squats',
      description: 'Build lower body strength',
      gradient: ['#FF6B9D', '#FFA07A'],
    },
    {
      id: 'pushups' as ExerciseOption,
      icon: Dumbbell,
      title: 'Pushups',
      description: 'Strengthen upper body',
      gradient: ['#6C63FF', '#9C8FFF'],
    },
    {
      id: 'planks' as ExerciseOption,
      icon: Timer,
      title: 'Planks',
      description: 'Core stability',
      gradient: ['#4ECDC4', '#70E9DD'],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 40) + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Dumbbell size={48} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Welcome to EarnScroll!</Text>
          <Text style={styles.subtitle}>
            Pick one exercise to use for free.{'\n'}You can switch it later from Settings.
          </Text>
        </View>

        <View style={styles.exerciseGrid}>
          {exercises.map((exercise) => {
            const Icon = exercise.icon;
            const isSelected = selectedExercise === exercise.id;
            
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  isSelected && styles.exerciseCardSelected,
                ]}
                onPress={() => handleExerciseSelect(exercise.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && { backgroundColor: exercise.gradient[0] + '20' },
                ]}>
                  <Icon 
                    size={32} 
                    color={isSelected ? exercise.gradient[0] : colors.light.text.secondary}
                    strokeWidth={2}
                  />
                </View>
                <Text style={[
                  styles.exerciseTitle,
                  isSelected && styles.exerciseTitleSelected,
                ]}>
                  {exercise.title}
                </Text>
                <Text style={styles.exerciseDescription}>
                  {exercise.description}
                </Text>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: exercise.gradient[0] }]}>
                    <Check size={16} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What&apos;s included in Free?</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Check size={18} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.infoText}>Access to your chosen exercise</Text>
            </View>
            <View style={styles.infoItem}>
              <Check size={18} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.infoText}>Unlimited Time Bank</Text>
            </View>
            <View style={styles.infoItem}>
              <Check size={18} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.infoText}>Streak tracking</Text>
            </View>
            <View style={styles.infoItem}>
              <Check size={18} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.infoText}>Emergency Access feature</Text>
            </View>
          </View>
          <View style={styles.proNote}>
            <Text style={styles.proNoteText}>
              Unlock all 3 exercises + custom ratios + full stats with Pro!
            </Text>
          </View>
          <View style={styles.permanentNote}>
            <Text style={styles.permanentNoteText}>
              You can switch your free exercise later from Settings.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedExercise && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedExercise}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {selectedExercise ? 'Continue' : 'Select an exercise'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.light.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: colors.light.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  exerciseGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.light.border.light,
    position: 'relative' as const,
    shadowColor: colors.shadow.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseCardSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.02 }],
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.light.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.light.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  exerciseTitleSelected: {
    color: colors.light.text.primary,
    fontWeight: '700' as const,
  },
  exerciseDescription: {
    fontSize: 12,
    color: colors.light.text.disabled,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.light.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.light.border.light,
    shadowColor: colors.shadow.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.light.text.primary,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.light.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  proNote: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.light.border.light,
  },
  proNoteText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 20,
  },
  permanentNote: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  permanentNoteText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: colors.light.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.light.text.inverse,
  },
});
