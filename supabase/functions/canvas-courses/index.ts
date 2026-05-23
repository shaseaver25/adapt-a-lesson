import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN_ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;

async function getKey(): Promise<CryptoKey> {
  const raw = new Uint8Array(TOKEN_ENCRYPTION_KEY.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
}
async function decrypt(b64: string): Promise<string> {
  const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const key = await getKey();
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

    const url = new URL(req.url);
    const canvasInstanceUrl = (url.searchParams.get("canvasInstanceUrl") || "").replace(/\/+$/, "");
    if (!canvasInstanceUrl) return json({ error: "canvasInstanceUrl required" }, 400);

    const { data: conn, error: connErr } = await admin
      .from("canvas_connections").select("encrypted_access_token")
      .eq("user_id", userId).eq("canvas_instance_url", canvasInstanceUrl).maybeSingle();
    if (connErr || !conn) return json({ error: "Canvas not connected" }, 404);

    const accessToken = await decrypt(conn.encrypted_access_token);

    const all: Array<{ id: number; name: string; courseCode: string }> = [];
    let next: string | null = `${canvasInstanceUrl}/api/v1/courses?enrollment_type=teacher&enrollment_state=active&per_page=100`;
    while (next) {
      const res = await fetch(next, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) return json({ error: "Canvas API error", status: res.status }, 502);
      const list = await res.json() as Array<Record<string, unknown>>;
      for (const c of list) {
        all.push({ id: Number(c.id), name: String(c.name ?? ""), courseCode: String(c.course_code ?? "") });
      }
      const link = res.headers.get("link") ?? "";
      const m = link.split(",").find(p => p.includes('rel="next"'));
      next = m ? m.match(/<([^>]+)>/)?.[1] ?? null : null;
    }
    return json({ courses: all });
  } catch (e) {
    console.error("canvas-courses error", (e as Error).message);
    return json({ error: "Internal error" }, 500);
  }
});