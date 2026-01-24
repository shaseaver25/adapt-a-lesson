import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseFirstTimeUserResult {
  isFirstTimeUser: boolean;
  loading: boolean;
  userName: string | null;
  dismissWelcome: () => void;
}

export const useFirstTimeUser = (): UseFirstTimeUserResult => {
  const { user } = useAuth();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('login_count, full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        // User is first-time if login_count is 1 (just logged in for the first time)
        setIsFirstTimeUser(profile?.login_count === 1);
        setUserName(profile?.full_name || null);
      } catch (err) {
        console.error('Error checking first-time user:', err);
      } finally {
        setLoading(false);
      }
    };

    checkFirstTimeUser();
  }, [user]);

  const dismissWelcome = () => {
    setIsFirstTimeUser(false);
  };

  return {
    isFirstTimeUser,
    loading,
    userName,
    dismissWelcome,
  };
};
