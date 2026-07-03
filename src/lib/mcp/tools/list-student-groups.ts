import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_student_groups",
  title: "List student groups",
  description: "List the signed-in user's student groups with reading level, home language, ELL and IEP/504 status.",
  inputSchema: {
    folderId: z.string().uuid().optional().describe("Optional class folder ID to scope results."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folderId }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabase
      .from("student_groups")
      .select("id, group_name, num_students, reading_level_label, home_language, ell_status, iep_504_status, accommodations, folder_id, updated_at")
      .order("updated_at", { ascending: false });
    if (folderId) query = query.eq("folder_id", folderId);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { groups: data },
    };
  },
});