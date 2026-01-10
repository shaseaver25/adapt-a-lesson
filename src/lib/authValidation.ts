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
  .min(12, 'Password must be at least 12 characters')
  .max(72, 'Password must be less than 72 characters');

// Full name validation schema
export const fullNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Company validation schema
export const companySchema = z
  .string()
  .min(2, 'Organization name must be at least 2 characters')
  .max(200, 'Organization name must be less than 200 characters');

// Organization type validation
export const organizationTypeSchema = z.enum(['school', 'non_profit', 'home_school', 'other']);

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
  company: companySchema,
  organizationType: organizationTypeSchema,
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
// Handles both error codes and error messages from Supabase
export function getAuthErrorMessage(errorCodeOrMessage: string | undefined): string {
  if (!errorCodeOrMessage) {
    return 'An unexpected error occurred. Please try again.';
  }
  
  const lowerMessage = errorCodeOrMessage.toLowerCase();
  
  // Check for common error codes first
  switch (errorCodeOrMessage) {
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
  }
  
  // Check for error message patterns (Supabase returns full messages)
  if (lowerMessage.includes('user already registered') || 
      lowerMessage.includes('already been registered') ||
      lowerMessage.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (lowerMessage.includes('invalid login credentials') ||
      lowerMessage.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (lowerMessage.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
    return 'Password is too weak. Please use a stronger password.';
  }
  
  if (lowerMessage.includes('signup') && lowerMessage.includes('disabled')) {
    return 'Sign up is currently disabled. Please contact support.';
  }
  
  if (lowerMessage.includes('banned') || lowerMessage.includes('suspended')) {
    return 'This account has been suspended. Please contact support.';
  }
  
  if (lowerMessage.includes('expired')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
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
