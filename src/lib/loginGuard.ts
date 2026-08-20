import { supabase } from '@/integrations/supabase/client';

/**
 * Account-lockout helpers. These run server-side (login-guard edge function)
 * because the underlying SECURITY DEFINER functions are no longer callable
 * directly by anonymous or signed-in clients.
 */
async function callGuard<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('login-guard', { body });
    if (error) return null;
    return data as T;
  } catch {
    return null;
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const data = await callGuard<{ exists: boolean }>({ action: 'check_email_exists', email });
  // Fail open so a transient error never blocks a legitimate sign-in.
  return data ? data.exists : true;
}

export async function checkAccountLocked(email: string): Promise<boolean> {
  const data = await callGuard<{ isLocked: boolean }>({ action: 'check_account_locked', email });
  return data?.isLocked ?? false;
}

export async function incrementFailedAttempts(email: string): Promise<{ isLocked: boolean }> {
  const data = await callGuard<{ isLocked: boolean }>({ action: 'increment_failed_login', email });
  return { isLocked: data?.isLocked ?? false };
}

export async function resetFailedAttempts(): Promise<void> {
  await callGuard({ action: 'reset_failed_login' });
}
