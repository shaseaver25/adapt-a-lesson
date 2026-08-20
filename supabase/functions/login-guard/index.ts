import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "check_email_exists" | "check_account_locked" | "increment_failed_login" | "reset_failed_login";

const ACTIONS: Action[] = [
  "check_email_exists",
  "check_account_locked",
  "increment_failed_login",
  "reset_failed_login",
];

const isValidEmail = (email: unknown): email is string =>
  typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => null);
    const action = body?.action as Action | undefined;
    if (!action || !ACTIONS.includes(action)) {
      return json({ error: "Invalid action" }, 400);
    }

    if (action === "reset_failed_login") {
      // Only the signed-in user may reset their own counter.
      const token = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) return json({ error: "Unauthorized" }, 401);
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
      const { error } = await supabase.rpc("reset_failed_login", { p_user_id: userData.user.id });
      if (error) return json({ error: "Request failed" }, 500);
      return json({ success: true });
    }

    if (!isValidEmail(body?.email)) {
      return json({ error: "Invalid email" }, 400);
    }
    const email = body.email.toLowerCase().trim();

    if (action === "check_email_exists") {
      const { data, error } = await supabase.rpc("check_email_exists", { p_email: email });
      if (error) return json({ error: "Request failed" }, 500);
      return json({ exists: data === true });
    }

    if (action === "check_account_locked") {
      const { data, error } = await supabase.rpc("check_account_locked", { p_email: email });
      if (error) return json({ error: "Request failed" }, 500);
      return json({ isLocked: data?.[0]?.is_locked === true });
    }

    const { data, error } = await supabase.rpc("increment_failed_login", { p_email: email });
    if (error) return json({ error: "Request failed" }, 500);
    return json({ isLocked: data?.[0]?.is_locked === true });
  } catch (_error) {
    return json({ error: "An error occurred processing your request" }, 500);
  }
});
