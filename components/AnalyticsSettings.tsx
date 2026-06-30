import { View, Text, Switch, StyleSheet } from 'react-native';
import { Shield, Activity, BarChart3 } from 'lucide-react-native';
import { useAnalytics } from '@/contexts/Analytics';

type Props = {
  theme: {
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    isDark: boolean;
  };
};

export function AnalyticsSettings({ theme }: Props) {
  const { consent, updateConsent } = useAnalytics();
  const accentColor = '#22D3EE';

  const handleDiagnosticsChange = (value: boolean) => {
    updateConsent(value, consent.analytics);
  };

  const handleAnalyticsChange = (value: boolean) => {
    updateConsent(consent.diagnostics, value);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Shield size={20} color={accentColor} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Privacy & Data
        </Text>
      </View>
      <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
        Control what data you share with us
      </Text>

      <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
        <View style={styles.settingRow}>
          <Activity size={18} color={accentColor} />
          <View style={styles.settingText}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Crash Reports & Diagnostics
            </Text>
            <Text
              style={[styles.settingSubtitle, { color: theme.textSecondary }]}
            >
              Help us find and fix bugs
            </Text>
          </View>
          <Switch
            value={consent.diagnostics}
            onValueChange={handleDiagnosticsChange}
            trackColor={{
              false: theme.isDark ? '#374151' : '#D1D5DB',
              true: accentColor,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : '#F1F5F9',
            },
          ]}
        />

        <View style={styles.settingRow}>
          <BarChart3 size={18} color={accentColor} />
          <View style={styles.settingText}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Usage Analytics
            </Text>
            <Text
              style={[styles.settingSubtitle, { color: theme.textSecondary }]}
            >
              Help us improve the app experience
            </Text>
          </View>
          <Switch
            value={consent.analytics}
            onValueChange={handleAnalyticsChange}
            trackColor={{
              false: theme.isDark ? '#374151' : '#D1D5DB',
              true: accentColor,
            }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    lineHeight: 18,
  },
  settingCard: {
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
});
