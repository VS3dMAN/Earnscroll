import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Shield, Activity, BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/contexts/Theme';
import { useAnalytics } from '@/contexts/Analytics';

export function ConsentPrompt() {
  const { showConsentPrompt, updateConsent, dismissConsentPrompt } = useAnalytics();
  const themeContext = useTheme();
  const theme = themeContext?.theme ?? {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#3B82F6',
    isDark: false,
  };

  const [diagnostics, setDiagnostics] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const accentColor = '#22D3EE';

  const handleSave = async () => {
    await updateConsent(diagnostics, analytics);
  };

  const handleDismiss = async () => {
    await dismissConsentPrompt();
  };

  return (
    <Modal
      visible={showConsentPrompt}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.isDark ? '#0F1629' : '#FFFFFF',
              borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.iconRow}>
            <Shield size={28} color={accentColor} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Help Improve EarnScroll
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Share anonymous data to help us fix bugs and build better features.
            You can change this anytime in Settings.
          </Text>

          <View
            style={[
              styles.optionCard,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255, 255, 255, 0.04)'
                  : '#F8FAFC',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.optionHeader}>
              <Activity size={20} color={accentColor} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Crash Reports & Diagnostics
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Helps us find and fix bugs that cause crashes or errors
                </Text>
              </View>
              <Switch
                value={diagnostics}
                onValueChange={setDiagnostics}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#D1D5DB',
                  true: accentColor,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View
            style={[
              styles.optionCard,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255, 255, 255, 0.04)'
                  : '#F8FAFC',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.optionHeader}>
              <BarChart3 size={20} color={accentColor} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Usage Analytics
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Helps us understand which features you use most
                </Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#D1D5DB',
                  true: accentColor,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <Text style={[styles.privacyNote, { color: theme.textSecondary }]}>
            No personal information is collected. Only anonymous usage data and
            crash reports are shared.
          </Text>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accentColor }]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Not Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  privacyNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
