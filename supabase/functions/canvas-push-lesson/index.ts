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
  const iv = buf.slice(0, 12); const ct = buf.slice(12);
  const key = await getKey();
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
}
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function err(code: string, message: string, status = 400, detail?: unknown) {
  return json({ error: message, code, detail }, status);
}

async function uploadImageToCanvas(
  canvasInstanceUrl: string, accessToken: string, courseId: number, imageUrl: string,
): Promise<{ canvasUrl: string; fileId: number } | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const blob = await imgRes.blob();
    const filename = (new URL(imageUrl).pathname.split("/").pop() || "image.png").split("?")[0];
    const size = blob.size;
    const contentType = blob.type || "image/png";

    // Step 1: notify Canvas
    const initRes = await fetch(`${canvasInstanceUrl}/api/v1/courses/${courseId}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: filename, size, content_type: contentType, parent_folder_path: "realpath-lessons" }),
    });
    if (!initRes.ok) return null;
    const init = await initRes.json() as { upload_url: string; upload_params: Record<string, string> };

    // Step 2: upload to returned URL
    const fd = new FormData();
    for (const [k, v] of Object.entries(init.upload_params)) fd.append(k, v);
    fd.append("file", blob, filename);
    const upRes = await fetch(init.upload_url, { method: "POST", body: fd, redirect: "manual" });

    // Step 3: finalize (follow redirect or POST to confirmation URL)
    let fileMeta: Record<string, unknown> | null = null;
    if (upRes.status >= 300 && upRes.status < 400) {
      const loc = upRes.headers.get("Location");
      if (loc) {
        const finRes = await fetch(loc, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Length": "0" } });
        if (finRes.ok) fileMeta = await finRes.json();
      }
    } else if (upRes.ok) {
      fileMeta = await upRes.json();
    }
    if (!fileMeta || !fileMeta.id) return null;
    const fileId = Number(fileMeta.id);
    const canvasUrl = String(fileMeta.url ?? `${canvasInstanceUrl}/courses/${courseId}/files/${fileId}/preview`);
    return { canvasUrl, fileId };
  } catch (e) {
    console.error("uploadImageToCanvas failed", (e as Error).message);
    return null;
  }
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

    const body = await req.json().catch(() => ({}));
    const courseId = Number(body.courseId);
    const moduleId = body.moduleId != null ? Number(body.moduleId) : null;
    const title = String(body.title || "Untitled Lesson");
    const bodyHtmlIn = String(body.bodyHtml || "");
    const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [];
    if (!courseId) return err("BAD_REQUEST", "courseId required", 400);

    const { data: conn, error: connErr } = await admin
      .from("canvas_connections")
      .select("encrypted_access_token, canvas_instance_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (connErr || !conn) return err("NO_CONNECTION", "No Canvas connection found for this user.", 404);
    const canvasInstanceUrl = String(conn.canvas_instance_url).replace(/\/+$/, "");
    const accessToken = await decrypt(conn.encrypted_access_token);

    let rewritten = bodyHtmlIn;
    let uploaded = 0;
    for (const src of imageUrls) {
      const r = await uploadImageToCanvas(canvasInstanceUrl, accessToken, courseId, src);
      if (r) {
        uploaded++;
        rewritten = rewritten.split(src).join(r.canvasUrl);
      } else {
        return err("IMAGE_UPLOAD_FAILED", `Failed to upload image to Canvas: ${src}`, 502, { src });
      }
    }

    const pageRes = await fetch(`${canvasInstanceUrl}/api/v1/courses/${courseId}/pages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ wiki_page: { title, body: rewritten, published: true, editing_roles: "teachers" } }),
    });
    if (!pageRes.ok) {
      const txt = await pageRes.text();
      console.error("Canvas page create failed", pageRes.status, txt.slice(0, 200));
      const code = pageRes.status === 401 ? "TOKEN_EXPIRED" : "CANVAS_API_ERROR";
      return err(code, "Canvas rejected the page create request.", 502, { status: pageRes.status, body: txt.slice(0, 500) });
    }
    const page = await pageRes.json() as { url: string; page_id: number; html_url?: string };

    if (moduleId) {
      const modRes = await fetch(`${canvasInstanceUrl}/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ module_item: { type: "Page", page_url: page.url, title } }),
      });
      if (!modRes.ok) {
        const txt = await modRes.text();
        console.error("Canvas module attach failed", modRes.status, txt.slice(0, 200));
        // Page is created — return success with a warning instead of failing hard.
      }
    }

    return json({
      pageUrl: page.html_url ?? `${canvasInstanceUrl}/courses/${courseId}/pages/${page.url}`,
      pageId: page.page_id,
      imagesUploaded: uploaded,
      imagesAttempted: imageUrls.length,
    });
  } catch (e) {
    console.error("canvas-push-lesson error", (e as Error).message);
    return err("INTERNAL", (e as Error).message || "Internal error", 500);
  }
});