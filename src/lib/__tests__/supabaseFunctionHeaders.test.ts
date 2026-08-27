import { describe, expect, it, vi, beforeEach } from 'vitest';

const getSession = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: () => getSession() } },
}));

const { buildFunctionHeaders, functionAuthHeaders, NotSignedInError } = await import(
  '../supabaseFunctionHeaders'
);

const PUBLISHABLE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

describe('the bearer token is the user, not the project key', () => {
  beforeEach(() => getSession.mockReset());

  it('puts the access token in Authorization', () => {
    const headers = buildFunctionHeaders('user-access-token');
    expect(headers.Authorization).toBe('Bearer user-access-token');
  });

  it('never sends the publishable key as the bearer token', () => {
    // The whole bug: the anon key looks like a credential and is accepted by
    // the gateway, but auth.getUser() resolves no user from it, so the function
    // answers 401 and the teacher sees an audio error.
    const headers = buildFunctionHeaders('user-access-token');
    expect(headers.Authorization).not.toContain(String(PUBLISHABLE));
  });

  it('still sends the publishable key as apikey, which is its job', () => {
    expect(buildFunctionHeaders('t').apikey).toBe(PUBLISHABLE);
  });

  it('uses the live session token', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'live-token' } }, error: null });
    expect((await functionAuthHeaders()).Authorization).toBe('Bearer live-token');
  });

  it('fails with a signed-out message rather than letting the call 401', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(functionAuthHeaders('generate audio')).rejects.toThrow(NotSignedInError);
    await expect(functionAuthHeaders('generate audio')).rejects.toThrow(/sign in again to generate audio/i);
  });

  it('treats a session lookup error as signed out', async () => {
    getSession.mockResolvedValue({ data: null, error: new Error('network') });
    await expect(functionAuthHeaders()).rejects.toThrow(NotSignedInError);
  });
});
