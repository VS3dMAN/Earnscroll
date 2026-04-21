import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Phone, Chrome, Apple } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/Auth';
import { useTheme } from '@/contexts/Theme';
import { EmailPasswordSchema } from '@/utils/authErrors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signInWithGoogle, signInWithApple, continueAsGuest } = useAuth();
  const themeContext = useTheme();
  const theme = themeContext?.theme;
  const isDark = theme?.isDark ?? true;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignIn = async () => {
    setError('');
    const result = EmailPasswordSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { success, error: authError } = await signInWithEmail(email, password);
    setLoading(false);

    if (!success && authError) {
      setError(authError);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const { success, error: authError } = await signInWithGoogle();
    setLoading(false);
    if (!success && authError && authError !== 'Sign-in was cancelled.') {
      setError(authError);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    const { success, error: authError } = await signInWithApple();
    setLoading(false);
    if (!success && authError && authError !== 'Sign-in was cancelled.') {
      setError(authError);
    }
  };

  const handlePhoneSignIn = () => {
    router.push('/(auth)/verify-phone');
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
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
          { paddingTop: Math.max(insets.top, 40) + 20, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: accentColor }]}>EarnScroll</Text>
          <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Sign in to sync your progress
          </Text>
        </View>

        {/* Email/Password Form */}
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
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
            <Lock size={18} color={textSecondary} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Password"
              placeholderTextColor={textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accentColor }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={[styles.linkText, { color: accentColor }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
          <Text style={[styles.dividerText, { color: textSecondary }]}>or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
        </View>

        {/* Social Login */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: cardBg, borderColor }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome size={20} color={textColor} />
            <Text style={[styles.socialButtonText, { color: textColor }]}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: cardBg, borderColor }]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <Apple size={20} color={textColor} />
              <Text style={[styles.socialButtonText, { color: textColor }]}>Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Phone Sign In */}
        <TouchableOpacity
          style={[styles.phoneButton, { backgroundColor: cardBg, borderColor }]}
          onPress={handlePhoneSignIn}
          disabled={loading}
        >
          <Phone size={18} color={textColor} />
          <Text style={[styles.phoneButtonText, { color: textColor }]}>Sign in with Phone</Text>
        </TouchableOpacity>

        {/* Guest Mode */}
        <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
          <Text style={[styles.guestButtonText, { color: textSecondary }]}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.footerLink, { color: accentColor }]}>Sign Up</Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
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
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    gap: 8,
    marginTop: 12,
  },
  phoneButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    marginTop: 8,
  },
  guestButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
