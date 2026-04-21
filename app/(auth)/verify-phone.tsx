import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/Auth';
import { useTheme } from '@/contexts/Theme';
import { PhoneSchema, OtpSchema } from '@/utils/authErrors';

type Step = 'phone' | 'otp';

export default function VerifyPhoneScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { signInWithPhone, verifyPhoneOtp } = useAuth();
  const themeContext = useTheme();
  const theme = themeContext?.theme;
  const isDark = theme?.isDark ?? true;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendCode = async () => {
    setError('');
    const result = PhoneSchema.safeParse({ phone });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { success, error: authError } = await signInWithPhone(phone);
    setLoading(false);

    if (!success && authError) {
      setError(authError);
      return;
    }

    setStep('otp');
    setResendTimer(60);
  };

  const handleVerifyOtp = async () => {
    setError('');
    const result = OtpSchema.safeParse({ otp });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { success, error: authError } = await verifyPhoneOtp(phone, otp);
    setLoading(false);

    if (!success && authError) {
      setError(authError);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    const { success, error: authError } = await signInWithPhone(phone);
    setLoading(false);

    if (!success && authError) {
      setError(authError);
      return;
    }
    setResendTimer(60);
    setOtp('');
  };

  const bg = isDark ? '#090F1B' : '#F8FAFC';
  const cardBg = isDark ? '#141B2B' : '#FFFFFF';
  const textColor = isDark ? '#F5F7FB' : '#0F172A';
  const textSecondary = isDark ? '#E0E5EE' : '#64748B';
  const borderColor = isDark ? '#1F2535' : '#E2E8F0';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F5F6';
  const accentColor = '#22D3EE';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 40) + 10, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 'otp' ? setStep('phone') : router.back())}
        >
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            {step === 'phone' ? 'Phone Sign In' : 'Enter Code'}
          </Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {step === 'phone'
              ? 'Enter your phone number with country code'
              : `We sent a 6-digit code to ${phone}`}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {step === 'phone' ? (
            <>
              <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                <Phone size={18} color={textSecondary} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="+1234567890"
                  placeholderTextColor={textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                <TextInput
                  style={[styles.input, styles.otpInput, { color: textColor }]}
                  placeholder="000000"
                  placeholderTextColor={textSecondary}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
                <Text
                  style={[
                    styles.resendText,
                    { color: resendTimer > 0 ? textSecondary : accentColor },
                  ]}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'SpaceMono_700Bold',
    letterSpacing: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  primaryButton: {
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
