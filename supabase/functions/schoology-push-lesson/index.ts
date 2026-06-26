/**
 * schoology-push-lesson
 *
 * POST body: {
 *   sectionId: string,
 *   pages: [{ title, bodyHtml, published?, groupKey? }],
 *   imageUrls?: string[]     // accepted for forward-compat; see image note below
 * }
 *
 * Creates one Schoology Page per part of the lesson (teacher guide + one per
 * student group), mirroring the multi-page contract of canvas-push-lesson so
 * the frontend dialog stays symmetric.
 *
 * v1 image handling: unlike Canvas (which re-hosts images into Canvas file
 * storage), this pushes the lesson HTML with its existing Supabase image URLs
 * in place. `imageUrls` is accepted but not re-hosted yet — that's a deliberate
 * follow-up pending a verified Schoology attachment endpoint. `imagesUploaded`
 * is therefore always 0 in v1.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json, errJson, decrypt, SchoologyClient, SchoologyApiError } from "../_shared/schoology.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type PageIn = { title: string; bodyHtml: string; published?: boolean; groupKey?: string };
type PageResult = {
  title: string;
  groupKey?: string;
  published: boolean;
  success: boolean;
  pageId?: string;
  error?: { code: string; message: string };
};

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
    const sectionId = String(body.sectionId ?? "").trim();
    const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [];

    // Multi-page contract; fall back to a single { title, bodyHtml }.
    let pages: PageIn[] = [];
    if (Array.isArray(body.pages) && body.pages.length > 0) {
      pages = body.pages.map((p: Record<string, unknown>) => ({
        title: String(p.title || "Untitled"),
        bodyHtml: String(p.bodyHtml || ""),
        published: p.published !== false,
        groupKey: p.groupKey ? String(p.groupKey) : undefined,
      }));
    } else if (body.bodyHtml) {
      pages = [{ title: String(body.title || "Untitled Lesson"), bodyHtml: String(body.bodyHtml), published: true }];
    }
    if (!sectionId) return errJson("BAD_REQUEST", "sectionId required", 400);
    if (pages.length === 0) return errJson("BAD_REQUEST", "pages required", 400);

    const { data: conn, error: connErr } = await admin
      .from("schoology_connections")
      .select("encrypted_consumer_key, encrypted_consumer_secret")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (connErr || !conn) return errJson("NO_CONNECTION", "No Schoology connection found for this user.", 404);

    const client = new SchoologyClient({
      consumerKey: await decrypt(conn.encrypted_consumer_key),
      consumerSecret: await decrypt(conn.encrypted_consumer_secret),
    });

    // v1: images are NOT re-hosted — HTML is pushed with Supabase URLs intact.
    const results: PageResult[] = [];
    for (const p of pages) {
      try {
        const page = await client.createPage({
          sectionId,
          title: p.title,
          bodyHtml: p.bodyHtml,
          published: p.published,
        });
        results.push({
          title: p.title,
          groupKey: p.groupKey,
          published: p.published !== false,
          success: true,
          pageId: page.id,
        });
      } catch (e) {
        const isAuth = e instanceof SchoologyApiError && e.status === 401;
        const code = isAuth ? "TOKEN_EXPIRED" : "SCHOOLOGY_API_ERROR";
        const message = e instanceof SchoologyApiError
          ? `Schoology rejected the page (${e.status}): ${e.message}`
          : (e as Error).message || "Unknown error";
        results.push({
          title: p.title,
          groupKey: p.groupKey,
          published: p.published !== false,
          success: false,
          error: { code, message },
        });
        // A bad key/secret fails every subsequent page too — stop early.
        if (isAuth) break;
      }
    }

    const partialFailure = results.some((r) => !r.success);
    return json({
      results,
      imagesUploaded: 0,
      imagesAttempted: new Set(imageUrls).size,
      partialFailure,
    });
  } catch (e) {
    console.error("schoology-push-lesson error", (e as Error).message);
    return errJson("INTERNAL", (e as Error).message || "Internal error", 500);
  }
});
