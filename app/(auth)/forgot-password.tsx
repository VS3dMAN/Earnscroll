import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/Auth';
import { useTheme } from '@/contexts/Theme';
import { z } from 'zod';

const EmailSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const themeContext = useTheme();
  const theme = themeContext?.theme;
  const isDark = theme?.isDark ?? true;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleReset = async () => {
    setError('');
    const result = EmailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { success: ok, error: authError } = await resetPassword(email);
    setLoading(false);

    if (!ok && authError) {
      setError(authError);
      return;
    }

    setSuccess(true);
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
      <View
        style={[
          styles.content,
          { paddingTop: Math.max(insets.top, 40) + 10, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {success
              ? `We sent a reset link to ${email}. Check your inbox.`
              : "Enter your email and we'll send you a reset link."}
          </Text>
        </View>

        {!success && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
              <Mail size={18} color={textSecondary} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Email"
                placeholderTextColor={textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {success && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accentColor }]}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
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
});
