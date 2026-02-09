import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Tracks page views for authenticated users.
 * Inserts a row into page_views on every route change.
 * Uses a session ID to group page views for bounce rate calculation.
 */
export function usePageViewTracker() {
  const location = useLocation();
  const { user } = useAuthContext();
  const sessionIdRef = useRef<string>(generateSessionId());
  const lastPathRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const path = location.pathname;

    // Skip duplicate rapid navigations to the same path
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;

    // Debounce to avoid tracking rapid redirects
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      supabase
        .from('page_views')
        .insert({
          user_id: user.id,
          page_path: path,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: sessionIdRef.current,
        })
        .then(({ error }) => {
          if (error) {
            console.warn('[PageViewTracker] Insert failed:', error.message);
          }
        });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [location.pathname, user]);
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
