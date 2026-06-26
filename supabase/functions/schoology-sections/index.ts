/**
 * schoology-sections
 *
 * GET → { sections: [{ id, title, courseTitle }] }
 *
 * Returns the sections the authenticated teacher is enrolled in. Populates the
 * section picker in the "Push to Schoology" dialog. Schoology is a single host,
 * so — unlike canvas-courses — there is no instance URL.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json, decrypt, SchoologyClient, SchoologyApiError } from "../_shared/schoology.ts";

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

    const { data: conn, error: connErr } = await admin
      .from("schoology_connections")
      .select("encrypted_consumer_key, encrypted_consumer_secret")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (connErr || !conn) return json({ error: "no_schoology_connection" }, 404);

    const client = new SchoologyClient({
      consumerKey: await decrypt(conn.encrypted_consumer_key),
      consumerSecret: await decrypt(conn.encrypted_consumer_secret),
    });

    try {
      const sections = await client.listSections();
      return json({ sections });
    } catch (e) {
      if (e instanceof SchoologyApiError) {
        return json({ error: "Schoology API error", detail: e.message }, e.status === 401 ? 401 : 502);
      }
      throw e;
    }
  } catch (e) {
    console.error("schoology-sections error", (e as Error).message);
    return json({ error: "Internal error" }, 500);
  }
});
