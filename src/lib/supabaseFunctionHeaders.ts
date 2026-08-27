import { supabase } from '@/integrations/supabase/client';

/**
 * Headers for calling an edge function with `fetch` rather than
 * `supabase.functions.invoke`.
 *
 * `invoke` attaches the signed-in user's access token for you. A hand-written
 * fetch does not, and the mistake this exists to prevent is sending the
 * publishable key as the bearer token instead: it looks like a credential and
 * is accepted by the network, but it identifies the project, not a person.
 * `auth.getUser()` then resolves no user and the function answers 401 — or
 * worse, in a function that does not require a user, quietly attributes the
 * work to nobody.
 *
 * Use `invoke` where you can. Reach for this only when the caller needs the raw
 * Response — to read a custom header or stream a blob — which is what `invoke`
 * does not expose.
 */

export class NotSignedInError extends Error {
  constructor(action = 'do that') {
    super(`Please sign in again to ${action}. Your session has expired.`);
    this.name = 'NotSignedInError';
  }
}

/** The project key. Identifies the project; never a substitute for a user token. */
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Build the headers from an access token. Pure, so the shape is testable
 * without a live session.
 */
export function buildFunctionHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // apikey identifies the project to the gateway...
    apikey: PUBLISHABLE_KEY,
    // ...while Authorization must carry the *user*, so the function can tell
    // who is asking.
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Headers carrying the current user's access token.
 * Throws NotSignedInError rather than letting the request fail as a 401 the
 * user cannot act on.
 */
export async function functionAuthHeaders(action?: string): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data?.session?.access_token;
  if (error || !accessToken) throw new NotSignedInError(action);
  return buildFunctionHeaders(accessToken);
}
