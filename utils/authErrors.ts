import { AuthError } from '@supabase/supabase-js';
import { z } from 'zod';

const ERROR_MAP: Record<string, string> = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please check your email to verify your account.',
  user_already_exists: 'An account with this email already exists.',
  weak_password: 'Password must be at least 8 characters.',
  otp_expired: 'That link has expired. Please request a new one.',
  over_request_rate_limit: 'Too many attempts. Please wait a few minutes.',
  // Email confirmation / recovery links carry a one-time token; a reused or
  // tampered link surfaces as invalid_otp.
  invalid_otp: 'That link is no longer valid. Please request a new one.',
  signup_disabled: 'Sign ups are currently disabled.',
  user_not_found: 'No account found with this email.',
  same_password: 'New password must be different from the old password.',
  email_address_invalid: 'That email address does not look deliverable. Please check it.',
};

const NETWORK_ERROR_MESSAGES = [
  'network request failed',
  'failed to fetch',
  'networkerror',
  'network error',
  'timeout',
  'unable to connect',
];

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return NETWORK_ERROR_MESSAGES.some((pattern) => msg.includes(pattern));
}

export function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  if (isNetworkError(error)) {
    return 'No internet connection. Please check your network and try again.';
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as AuthError).code ?? '';
    if (ERROR_MAP[code]) return ERROR_MAP[code];
  }
  if (error instanceof Error) {
    return error.message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export const EmailPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const SignUpSchema = z
  .object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

