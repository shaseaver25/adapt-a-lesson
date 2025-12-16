import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserSession {
  id: string;
  session_id: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}

const MAX_SESSIONS = 3;
const SESSION_KEY = 'device_session_id';

// Generate a unique session ID for this device
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

// Parse user agent to get device info
const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
};

export function useSessionManagement() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSessionId = getOrCreateSessionId();

  // Check if user can create a new session (under limit)
  const checkSessionLimit = useCallback(async (userId: string): Promise<{ allowed: boolean; count: number }> => {
    try {
      const { data, error } = await supabase.rpc('count_active_sessions', { p_user_id: userId });
      if (error) throw error;
      const count = data ?? 0;
      return { allowed: count < MAX_SESSIONS, count };
    } catch (err) {
      console.error('Error checking session limit:', err);
      return { allowed: true, count: 0 }; // Allow on error to not block login
    }
  }, []);

  // Create a new session record
  const createSession = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // First cleanup inactive sessions
      await supabase.rpc('cleanup_inactive_sessions', { p_user_id: userId });

      // Check limit after cleanup
      const { allowed } = await checkSessionLimit(userId);
      if (!allowed) return false;

      const deviceInfo = getDeviceInfo();

      // Upsert session (update if exists, insert if not)
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: userId,
          session_id: currentSessionId,
          device_info: deviceInfo,
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,session_id',
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error creating session:', err);
      return false;
    }
  }, [currentSessionId, checkSessionLimit]);

  // Update last_active_at for current session
  const updateSessionActivity = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('session_id', currentSessionId);
    } catch (err) {
      console.error('Error updating session activity:', err);
    }
  }, [currentSessionId]);

  // Remove current session on logout
  const removeCurrentSession = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', currentSessionId);
    } catch (err) {
      console.error('Error removing session:', err);
    }
  }, [currentSessionId]);

  // Fetch all sessions for user
  const fetchSessions = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      const sessionsWithCurrent = (data || []).map(session => ({
        ...session,
        is_current: session.session_id === currentSessionId,
      }));

      setSessions(sessionsWithCurrent);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [currentSessionId]);

  // Remove a specific session
  const removeSession = useCallback(async (userId: string, sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      if (error) throw error;
      
      // Refresh sessions list
      await fetchSessions(userId);
      return true;
    } catch (err) {
      console.error('Error removing session:', err);
      return false;
    }
  }, [fetchSessions]);

  // Remove all other sessions
  const removeAllOtherSessions = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .neq('session_id', currentSessionId);

      if (error) throw error;
      
      // Refresh sessions list
      await fetchSessions(userId);
      return true;
    } catch (err) {
      console.error('Error removing other sessions:', err);
      return false;
    }
  }, [currentSessionId, fetchSessions]);

  return {
    sessions,
    loading,
    error,
    currentSessionId,
    checkSessionLimit,
    createSession,
    updateSessionActivity,
    removeCurrentSession,
    fetchSessions,
    removeSession,
    removeAllOtherSessions,
  };
}
