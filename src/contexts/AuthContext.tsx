import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSessionDuration } from '@/hooks/useSessionDuration';

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

function AuthProviderContent({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Track session duration for analytics
  const { endSession } = useSessionDuration({ 
    userId: user?.id ?? null, 
    enabled: !!user 
  });

  useEffect(() => {
    console.log('Auth: Starting session check...');
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Auth: Session from localStorage:', currentSession ? 'Found' : 'Not found');
      console.log('Auth: User ID:', currentSession?.user?.id || 'none');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth: onAuthStateChange', event, currentSession?.user?.id || 'no session');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // End session tracking before signing out
    await endSession();
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

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthProviderContent>{children}</AuthProviderContent>;
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
