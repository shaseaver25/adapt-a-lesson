import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CANVAS_CLIENT_ID = Deno.env.get("CANVAS_CLIENT_ID")!;
const CANVAS_REDIRECT_URI = Deno.env.get("CANVAS_REDIRECT_URI")!;

const SCOPES = [
  "url:GET|/api/v1/courses",
  "url:POST|/api/v1/courses/:course_id/files",
  "url:POST|/api/v1/courses/:course_id/pages",
].join(" ");

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
    const canvasInstanceUrl = String(body.canvasInstanceUrl || "").replace(/\/+$/, "");
    if (!/^https:\/\/[^\s]+$/.test(canvasInstanceUrl)) {
      return json({ error: "Invalid canvasInstanceUrl" }, 400);
    }

    const stateBytes = crypto.getRandomValues(new Uint8Array(32));
    const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insErr } = await admin.from("canvas_oauth_state").insert({
      state, user_id: userId, canvas_instance_url: canvasInstanceUrl, expires_at: expiresAt,
    });
    if (insErr) return json({ error: "State persist failed" }, 500);

    const params = new URLSearchParams({
      client_id: CANVAS_CLIENT_ID,
      response_type: "code",
      redirect_uri: CANVAS_REDIRECT_URI,
      state,
      scope: SCOPES,
      purpose: "RealPath Learning",
    });
    const authorizeUrl = `${canvasInstanceUrl}/login/oauth2/auth?${params.toString()}`;
    return json({ authorizeUrl, state });
  } catch (e) {
    console.error("canvas-oauth-start error", (e as Error).message);
    return json({ error: "Internal error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}