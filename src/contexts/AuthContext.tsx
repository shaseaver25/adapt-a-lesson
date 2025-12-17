import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);  // Start true

  useEffect(() => {
    console.log('Auth: Starting session check...');
    
    // CRITICAL: Get existing session on mount FIRST
    // This restores the session from localStorage in new tabs
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Auth: Session from localStorage:', currentSession ? 'Found' : 'Not found');
      console.log('Auth: User ID:', currentSession?.user?.id || 'none');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);  // Only set false AFTER we have the result
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth: onAuthStateChange', event, currentSession?.user?.id || 'no session');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // Don't set loading here - getSession handles initial load
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Re-export for backwards compatibility
export { useAuth, useRequireAuth, isSessionExpired } from '@/hooks/useAuth';
