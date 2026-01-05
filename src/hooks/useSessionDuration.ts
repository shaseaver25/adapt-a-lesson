import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity

interface UseSessionDurationOptions {
  userId: string | null;
  enabled?: boolean;
}

export function useSessionDuration({ userId, enabled = true }: UseSessionDurationOptions) {
  const sessionStartTime = useRef<number | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulatedTime = useRef<number>(0);

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
  }, []);

  // Calculate active session time
  const getActiveSessionTime = useCallback(() => {
    if (!sessionStartTime.current) return 0;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;
    
    // If user has been inactive, don't count that time
    if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
      return accumulatedTime.current;
    }
    
    return accumulatedTime.current + (now - sessionStartTime.current);
  }, []);

  // Save session duration to database
  const saveSessionDuration = useCallback(async (durationSeconds: number) => {
    if (!userId || durationSeconds < 5) return; // Don't save very short sessions
    
    try {
      // Use RPC to update time stats
      const { error } = await supabase.rpc('update_user_time_stats', {
        p_user_id: userId,
        p_duration_seconds: durationSeconds
      });

      if (error) {
        console.error('Failed to save session duration:', error);
      }
    } catch (error) {
      console.error('Error saving session duration:', error);
    }
  }, [userId]);

  // End current session and save
  const endSession = useCallback(async () => {
    if (!sessionStartTime.current) return;
    
    const durationMs = getActiveSessionTime();
    const durationSeconds = Math.floor(durationMs / 1000);
    
    if (durationSeconds > 0) {
      await saveSessionDuration(durationSeconds);
    }
    
    sessionStartTime.current = null;
    accumulatedTime.current = 0;
  }, [getActiveSessionTime, saveSessionDuration]);

  // Start tracking session
  const startSession = useCallback(() => {
    if (sessionStartTime.current) return; // Already tracking
    
    sessionStartTime.current = Date.now();
    lastActivityTime.current = Date.now();
    accumulatedTime.current = 0;
  }, []);

  // Heartbeat to periodically save progress
  const heartbeat = useCallback(async () => {
    if (!userId || !sessionStartTime.current) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;
    
    // If user is inactive, pause tracking but save current progress
    if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
      const activeTime = Math.floor(accumulatedTime.current / 1000);
      if (activeTime > 0) {
        await saveSessionDuration(activeTime);
        accumulatedTime.current = 0;
      }
      sessionStartTime.current = null; // Pause session
      return;
    }
    
    // Accumulate time and reset start
    accumulatedTime.current += now - sessionStartTime.current;
    sessionStartTime.current = now;
  }, [userId, saveSessionDuration]);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Start session on mount
    startSession();

    // Set up activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      updateActivity();
      // Resume session if it was paused due to inactivity
      if (!sessionStartTime.current) {
        startSession();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up heartbeat
    heartbeatInterval.current = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, save current session
        heartbeat();
      } else {
        // Page is visible again
        updateActivity();
        if (!sessionStartTime.current) {
          startSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload - save session before leaving
    const handleBeforeUnload = () => {
      if (sessionStartTime.current) {
        const durationMs = getActiveSessionTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        
        if (durationSeconds > 0 && userId) {
          // Use sendBeacon for reliable data sending on page unload
          const data = JSON.stringify({
            user_id: userId,
            duration_seconds: durationSeconds
          });
          
          // Store in localStorage as backup - will be synced on next visit
          const pending = localStorage.getItem('pending_session_duration');
          const pendingData = pending ? JSON.parse(pending) : [];
          pendingData.push({ userId, durationSeconds, timestamp: Date.now() });
          localStorage.setItem('pending_session_duration', JSON.stringify(pendingData));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check for pending session data from previous visits
    const syncPendingDurations = async () => {
      const pending = localStorage.getItem('pending_session_duration');
      if (pending) {
        const pendingData = JSON.parse(pending);
        localStorage.removeItem('pending_session_duration');
        
        for (const item of pendingData) {
          if (item.userId === userId && item.durationSeconds > 0) {
            await saveSessionDuration(item.durationSeconds);
          }
        }
      }
    };

    syncPendingDurations();

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      // Save session on unmount
      endSession();
    };
  }, [enabled, userId, startSession, updateActivity, heartbeat, endSession, getActiveSessionTime, saveSessionDuration]);

  return {
    getActiveSessionTime,
    endSession
  };
}
