import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  userId: string | null;
}

export function useAdmin(): AdminStatus {
  const [status, setStatus] = useState<AdminStatus>({
    isAdmin: false,
    isSuperAdmin: false,
    loading: true,
    error: null,
    userId: null,
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus({ isAdmin: false, isSuperAdmin: false, loading: false, error: null, userId: null });
        return;
      }

      // Check if user is admin using RPC function
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (adminError) {
        setStatus({ isAdmin: false, isSuperAdmin: false, loading: false, error: adminError.message, userId: user.id });
        return;
      }

      // Check if user is super_admin
      const { data: isSuperAdmin, error: superError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      if (superError) {
        setStatus({ isAdmin: !!isAdmin, isSuperAdmin: false, loading: false, error: superError.message, userId: user.id });
        return;
      }

      setStatus({
        isAdmin: !!isAdmin,
        isSuperAdmin: !!isSuperAdmin,
        loading: false,
        error: null,
        userId: user.id,
      });
    } catch (err) {
      setStatus({
        isAdmin: false,
        isSuperAdmin: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        userId: null,
      });
    }
  }

  return status;
}
