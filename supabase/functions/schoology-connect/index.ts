/**
 * schoology-connect
 *
 * POST body: { consumerKey, consumerSecret }
 *
 * Two-legged connect — no OAuth redirect dance (that's the Canvas model).
 * The teacher generates a personal API key/secret in their Schoology account
 * (requires the "Access Schoology API" permission) and submits both. We verify
 * the credentials work (one signed /users/me call), then encrypt and store them.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json, encrypt, SchoologyClient, SchoologyApiError } from "../_shared/schoology.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing auth" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Invalid token" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const consumerKey = String(body.consumerKey ?? "").trim();
    const consumerSecret = String(body.consumerSecret ?? "").trim();
    if (!consumerKey || !consumerSecret) {
      return json({ error: "consumerKey and consumerSecret are required" }, 400);
    }

    // Verify before storing — fail fast on a bad key/secret or missing API access.
    let schoologyUserId: string;
    try {
      const me = await new SchoologyClient({ consumerKey, consumerSecret }).getMe();
      schoologyUserId = me.uid;
    } catch (e) {
      if (e instanceof SchoologyApiError) {
        const status = e.status === 401 || e.status === 403 ? 400 : 502;
        return json({ error: `Schoology rejected these credentials: ${e.message}` }, status);
      }
      throw e;
    }

    const { error: upsertErr } = await admin.from("schoology_connections").upsert(
      {
        user_id: userId,
        schoology_user_id: schoologyUserId,
        encrypted_consumer_key: await encrypt(consumerKey),
        encrypted_consumer_secret: await encrypt(consumerSecret),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (upsertErr) {
      console.error("schoology-connect upsert failed", upsertErr.message);
      return json({ error: "Failed to store connection" }, 500);
    }

    return json({ connected: true, schoologyUserId });
  } catch (e) {
    console.error("schoology-connect error", (e as Error).message);
    return json({ error: "Internal error" }, 500);
  }
});
