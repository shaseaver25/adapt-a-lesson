import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface SubscriptionState {
  isSubscribed: boolean;
  tier: 'monthly' | 'yearly' | null;
  subscriptionEnd: string | null;
  isTrialing: boolean;
  trialEnd: string | null;
  daysRemaining: number | null;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user, session } = useAuthContext();
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    isSubscribed: false,
    tier: null,
    subscriptionEnd: null,
    isTrialing: false,
    trialEnd: null,
    daysRemaining: null,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setSubscriptionState({
        isSubscribed: false,
        tier: null,
        subscriptionEnd: null,
        isTrialing: false,
        trialEnd: null,
        daysRemaining: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setSubscriptionState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // TEMPORARY: Bypass subscription check - all users get free access
      // To re-enable payments, restore original logic:
      // isSubscribed: data.subscribed ?? false,
      setSubscriptionState({
        isSubscribed: true,
        tier: data.tier ?? 'monthly',
        subscriptionEnd: data.subscriptionEnd ?? null,
        isTrialing: false,
        trialEnd: null,
        daysRemaining: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setSubscriptionState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to check subscription',
      }));
    }
  }, [user, session]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const createCheckout = async (priceId: string, mode: 'subscription' | 'payment') => {
    if (!session) {
      throw new Error('User must be logged in to checkout');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, mode },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  };

  const openCustomerPortal = async () => {
    if (!session) {
      throw new Error('User must be logged in');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  };

  return {
    ...subscriptionState,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
