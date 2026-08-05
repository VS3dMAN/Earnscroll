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
import { Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/Auth';
import { useTheme } from '@/contexts/Theme';
import { z } from 'zod';

const NewPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

/**
 * Reached only via a password-recovery deep link. The link already produced a
 * session, so `updateUser({ password })` is all that is left — the root layout
 * pins the user here until it succeeds or they cancel.
 */
export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { updatePassword, cancelPasswordRecovery } = useAuth();
  const themeContext = useTheme();
  const isDark = themeContext?.theme?.isDark ?? true;
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    setError('');
    const result = NewPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { success, error: authError } = await updatePassword(password);
    setLoading(false);

    if (!success && authError) {
      setError(authError);
      return;
    }
    // On success the recovery flag clears and the root layout routes onward.
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
          { paddingTop: Math.max(insets.top, 40) + 20, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Set a new password</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Choose a password you haven&apos;t used before.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
            <Lock size={18} color={textSecondary} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="New password"
              placeholderTextColor={textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoFocus
              testID="reset-password-input"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
            <Lock size={18} color={textSecondary} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Confirm new password"
              placeholderTextColor={textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              testID="reset-password-confirm-input"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accentColor }]}
            onPress={handleSubmit}
            disabled={loading}
            testID="reset-password-submit"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelPasswordRecovery}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
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
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
});
