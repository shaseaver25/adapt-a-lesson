import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyData {
  date: string;
  value: number;
}

interface TopItem {
  name: string;
  value: number;
}

interface SiteAnalytics {
  visitors: { total: number; daily: DailyData[] };
  pageviews: { total: number; daily: DailyData[] };
  pageviewsPerVisit: { total: number; daily: DailyData[] };
  sessionDuration: { total: number; daily: DailyData[] };
  bounceRate: { total: number; daily: DailyData[] };
  topPages: TopItem[];
  topSources: TopItem[];
  devices: TopItem[];
  countries: TopItem[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", userData.user.id)
        .in("role", ["admin", "super_admin"])
        .single();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Date range
    const url = new URL(req.url);
    const endDate = url.searchParams.get("endDate") || new Date().toISOString().split("T")[0];
    const startDate = url.searchParams.get("startDate") ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    console.log("[GET-SITE-ANALYTICS] Querying page_views", { startDate, endDate });

    // Fetch page_views
    const { data: pageViews } = await supabase
      .from("page_views")
      .select("user_id, page_path, referrer, user_agent, session_id, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true });

    const rows = pageViews || [];

    // --- Visitors daily (unique user_ids per day) ---
    const dayVisitors = new Map<string, Set<string>>();
    const dayPageviews = new Map<string, number>();
    const pageCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    const sessionPages = new Map<string, Set<string>>();
    let desktopCount = 0;
    let mobileCount = 0;

    for (const row of rows) {
      const day = row.created_at.split("T")[0];

      // Visitors
      if (!dayVisitors.has(day)) dayVisitors.set(day, new Set());
      if (row.user_id) dayVisitors.get(day)!.add(row.user_id);

      // Pageviews
      dayPageviews.set(day, (dayPageviews.get(day) || 0) + 1);

      // Top pages
      pageCounts.set(row.page_path, (pageCounts.get(row.page_path) || 0) + 1);

      // Traffic sources
      const source = parseSource(row.referrer);
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);

      // Devices
      if (row.user_agent && /mobile|android|iphone|ipad/i.test(row.user_agent)) {
        mobileCount++;
      } else {
        desktopCount++;
      }

      // Session tracking for bounce rate
      if (row.session_id) {
        if (!sessionPages.has(row.session_id)) sessionPages.set(row.session_id, new Set());
        sessionPages.get(row.session_id)!.add(row.page_path);
      }
    }

    // Fill missing dates
    const current = new Date(startDate);
    const end = new Date(endDate);
    const visitorsDaily: DailyData[] = [];
    const pageviewsDaily: DailyData[] = [];
    while (current <= end) {
      const d = current.toISOString().split("T")[0];
      visitorsDaily.push({ date: d, value: dayVisitors.get(d)?.size || 0 });
      pageviewsDaily.push({ date: d, value: dayPageviews.get(d) || 0 });
      current.setDate(current.getDate() + 1);
    }

    const totalVisitors = new Set(rows.filter(r => r.user_id).map(r => r.user_id)).size;
    const totalPageviews = rows.length;
    const avgPagesPerVisit = totalVisitors > 0 ? totalPageviews / totalVisitors : 0;

    // Bounce rate
    const totalSessions = sessionPages.size;
    const bouncedSessions = Array.from(sessionPages.values()).filter(pages => pages.size === 1).length;
    const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;

    // Session duration from user_sessions
    const { data: sessionData } = await supabase
      .from("user_sessions")
      .select("session_duration_seconds")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .not("session_duration_seconds", "is", null);

    const durations = (sessionData || []).map(s => s.session_duration_seconds || 0).filter(d => d > 0);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // Top pages
    const topPages: TopItem[] = Array.from(pageCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Traffic sources
    const topSources: TopItem[] = Array.from(sourceCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Devices
    const devices: TopItem[] = [];
    if (desktopCount > 0 || mobileCount > 0) {
      devices.push({ name: "Desktop", value: desktopCount });
      devices.push({ name: "Mobile", value: mobileCount });
    }

    const analytics: SiteAnalytics = {
      visitors: { total: totalVisitors, daily: visitorsDaily },
      pageviews: { total: totalPageviews, daily: pageviewsDaily },
      pageviewsPerVisit: { total: avgPagesPerVisit, daily: [] },
      sessionDuration: { total: avgDuration, daily: [] },
      bounceRate: { total: bounceRate, daily: [] },
      topPages,
      topSources,
      devices,
      countries: [{ name: "Not tracked (privacy)", value: totalVisitors }],
    };

    console.log("[GET-SITE-ANALYTICS] Result", {
      totalVisitors, totalPageviews, totalSessions, bounceRate, avgDuration,
    });

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET-SITE-ANALYTICS] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseSource(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "");
    if (!hostname) return "Direct";
    return hostname;
  } catch {
    return "Direct";
  }
}
