import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Full name validation schema
export const fullNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .optional();

// Sign in form schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Sign up form schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: fullNameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Reset password schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Update password schema
export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type exports
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

// Helper function to get friendly error messages
export function getAuthErrorMessage(errorCode: string | undefined): string {
  switch (errorCode) {
    case 'invalid_credentials':
    case 'invalid_grant':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'email_not_confirmed':
      return 'Please verify your email address before signing in.';
    case 'user_not_found':
      return 'No account found with this email address.';
    case 'user_already_exists':
      return 'An account with this email already exists. Please sign in instead.';
    case 'weak_password':
      return 'Password is too weak. Please use a stronger password.';
    case 'over_request_rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    case 'signup_disabled':
      return 'Sign up is currently disabled. Please contact support.';
    case 'user_banned':
      return 'This account has been suspended. Please contact support.';
    case 'session_expired':
      return 'Your session has expired. Please sign in again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Check if account might be locked based on failed attempts
export async function checkAccountLockStatus(email: string): Promise<{
  isLocked: boolean;
  remainingAttempts?: number;
  lockExpiresAt?: Date;
}> {
  // This would typically call an edge function to check
  // For now, return unlocked status
  return {
    isLocked: false,
    remainingAttempts: 5,
  };
}
