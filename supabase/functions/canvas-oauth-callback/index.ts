import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CANVAS_CLIENT_ID = Deno.env.get("CANVAS_CLIENT_ID")!;
const CANVAS_CLIENT_SECRET = Deno.env.get("CANVAS_CLIENT_SECRET")!;
const CANVAS_REDIRECT_URI = Deno.env.get("CANVAS_REDIRECT_URI")!;
const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN")!;

async function getKey(): Promise<CryptoKey> {
  const raw = new Uint8Array(TOKEN_ENCRYPTION_KEY.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
}
async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errParam = url.searchParams.get("error");
    if (errParam) return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=${encodeURIComponent(errParam)}`);
    if (!code || !state) return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=missing_params`);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: stateRow, error: stateErr } = await admin
      .from("canvas_oauth_state").select("*").eq("state", state).maybeSingle();
    if (stateErr || !stateRow) return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=invalid_state`);

    // Single-use: delete immediately
    await admin.from("canvas_oauth_state").delete().eq("state", state);

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=state_expired`);
    }

    const canvasInstanceUrl = stateRow.canvas_instance_url as string;
    const userId = stateRow.user_id as string;

    const tokenRes = await fetch(`${canvasInstanceUrl}/login/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CANVAS_CLIENT_ID,
        client_secret: CANVAS_CLIENT_SECRET,
        redirect_uri: CANVAS_REDIRECT_URI,
        code,
      }),
    });
    if (!tokenRes.ok) {
      console.error("Canvas token exchange failed", tokenRes.status);
      return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=token_exchange_failed`);
    }
    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token as string;
    const refreshToken = (tokens.refresh_token as string | undefined) ?? null;
    const expiresIn = tokens.expires_in as number | undefined;
    const canvasUserId = tokens.user?.id ? Number(tokens.user.id) : null;
    const scope = (tokens.scope as string | undefined) ?? null;

    const encAccess = await encrypt(accessToken);
    const encRefresh = refreshToken ? await encrypt(refreshToken) : null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { error: upErr } = await admin.from("canvas_connections").upsert({
      user_id: userId,
      canvas_instance_url: canvasInstanceUrl,
      canvas_user_id: canvasUserId,
      encrypted_access_token: encAccess,
      encrypted_refresh_token: encRefresh,
      token_expires_at: expiresAt,
      scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,canvas_instance_url" });
    if (upErr) {
      console.error("Upsert failed", upErr.message);
      return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=persist_failed`);
    }

    return redirect(`${FRONTEND_ORIGIN}/settings/canvas?connected=1`);
  } catch (e) {
    console.error("canvas-oauth-callback error", (e as Error).message);
    return redirect(`${FRONTEND_ORIGIN}/settings/canvas?error=internal`);
  }
});