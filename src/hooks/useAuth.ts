import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Auth redirect URL - changes based on environment
const getRedirectUrl = () => `${window.location.origin}/`;

// Session timeout in seconds (12 hours)
const SESSION_TIMEOUT_SECONDS = 12 * 60 * 60;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null; data?: { user: User | null } }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'azure' | 'canvas') => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Track login attempt via edge function
  const trackLoginAttempt = useCallback(async (
    email: string,
    success: boolean,
    userId?: string,
    failureReason?: string
  ) => {
    try {
      await supabase.functions.invoke('track-login-attempt', {
        body: {
          email,
          success,
          userId,
          failureReason,
          userAgent: navigator.userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to track login attempt:', err);
    }
  }, []);

  // Update login stats in profile
  const updateLoginStats = useCallback(async (userId: string) => {
    try {
      await supabase.rpc('update_login_stats', { p_user_id: userId });
    } catch (err) {
      console.error('Failed to update login stats:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Track successful OAuth login and update stats
        if (event === 'SIGNED_IN' && currentSession?.user) {
          setTimeout(() => {
            trackLoginAttempt(
              currentSession.user.email || '',
              true,
              currentSession.user.id
            );
            updateLoginStats(currentSession.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [trackLoginAttempt, updateLoginStats]);

  // Sign in with email/password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      await trackLoginAttempt(email, false, undefined, signInError.message);
      setError(signInError);
      return { error: signInError };
    }

    if (data.user) {
      await trackLoginAttempt(email, true, data.user.id);
      await updateLoginStats(data.user.id);
    }

    return { error: null, data: { user: data.user } };
  }, [trackLoginAttempt, updateLoginStats]);

  // Sign up with email/password
  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string, 
    fullName?: string
  ) => {
    setError(null);
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      await trackLoginAttempt(email, false, undefined, signUpError.message);
      setError(signUpError);
      return { error: signUpError };
    }

    if (data.user) {
      await trackLoginAttempt(email, true, data.user.id);
    }

    return { error: null };
  }, [trackLoginAttempt]);

  // Sign in with OAuth provider
  const signInWithOAuth = useCallback(async (provider: 'google' | 'azure' | 'canvas') => {
    setError(null);

    // Map provider names to Supabase provider types
    let supabaseProvider: Provider;
    
    switch (provider) {
      case 'google':
        supabaseProvider = 'google';
        break;
      case 'azure':
        // Microsoft/Azure AD
        supabaseProvider = 'azure';
        break;
      case 'canvas':
        // Canvas LMS would need to be configured as a custom OIDC provider
        // For now, we'll note this requires manual Supabase dashboard configuration
        console.warn('Canvas LMS OAuth requires custom OIDC configuration in Supabase dashboard');
        // Use generic OIDC if configured, otherwise this will fail gracefully
        return { 
          error: { 
            message: 'Canvas LMS OAuth not yet configured. Please configure custom OIDC provider in Supabase dashboard.',
            name: 'AuthError',
            status: 400,
          } as AuthError 
        };
      default:
        return { 
          error: { 
            message: 'Unknown provider', 
            name: 'AuthError',
            status: 400,
          } as AuthError 
        };
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: provider === 'azure' ? {
          // Azure-specific: request offline access for refresh tokens
          prompt: 'consent',
        } : undefined,
      },
    });

    if (oauthError) {
      setError(oauthError);
      return { error: oauthError };
    }

    return { error: null };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      setError(signOutError);
      return { error: signOutError };
    }

    setUser(null);
    setSession(null);
    
    return { error: null };
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError);
      return { error: resetError };
    }

    return { error: null };
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError);
      return { error: updateError };
    }

    return { error: null };
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      setError(refreshError);
      return;
    }

    setSession(data.session);
    setUser(data.user);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };
}

// Helper hook to require authentication
export function useRequireAuth(redirectTo: string = '/auth') {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      window.location.href = redirectTo;
    }
  }, [auth.loading, auth.user, redirectTo]);

  return auth;
}

// Helper to check if session is expired based on inactivity
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  
  const expiresAt = session.expires_at;
  if (!expiresAt) return true;
  
  // Check if session has expired
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt;
}
