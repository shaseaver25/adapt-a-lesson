import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Google's own cap is generous; ours keeps a runaway document from filling memory. */
const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(code: string, message: string, status: number) {
  return json({ error: message, code }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Importing costs an outbound fetch, so it is for signed-in users only.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return err("UNAUTHENTICATED", "Missing auth", 401);
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return err("UNAUTHENTICATED", "Invalid token", 401);

    const body = await req.json().catch(() => ({}));
    const documentId = String(body.documentId ?? "");

    // The client sends an id, never a URL, and it is re-validated here. The
    // export address is built from the id below, so nothing a user pastes can
    // point this fetch at another host.
    if (!/^[a-zA-Z0-9_-]{20,120}$/.test(documentId)) {
      return err(
        "BAD_DOCUMENT_ID",
        "That does not look like a Google Docs link. Copy the address from the browser bar while the document is open.",
        400,
      );
    }

    const exportUrl =
      `https://docs.google.com/document/d/${documentId}/export?format=html`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(exportUrl, { redirect: "follow", signal: controller.signal });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return err("TIMEOUT", "Google took too long to respond. Try again in a moment.", 504);
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }

    // A document that is not shared redirects to a sign-in page rather than
    // returning an error status, so the body is checked on the client too.
    if (res.status === 404) {
      return err(
        "NOT_FOUND",
        "No document was found at that link. Check the address and try again.",
        404,
      );
    }
    if (res.status === 401 || res.status === 403) {
      return err(
        "NOT_SHARED",
        'That document is not shared. In Google Docs choose Share, set General access to "Anyone with the link", then paste the link again.',
        403,
      );
    }
    if (!res.ok) {
      return err("FETCH_FAILED", `Google returned ${res.status} for that document.`, 502);
    }

    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared > MAX_BYTES) {
      return err("TOO_LARGE", "That document is too large to import.", 413);
    }

    const html = await res.text();
    if (html.length > MAX_BYTES) {
      return err("TOO_LARGE", "That document is too large to import.", 413);
    }

    return json({ html, finalUrl: res.url });
  } catch (error) {
    console.error("import-google-doc error:", error);
    return err(
      "UNEXPECTED",
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});
