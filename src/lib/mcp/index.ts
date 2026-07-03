import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listLessons from "./tools/list-lessons";
import getLesson from "./tools/get-lesson";
import listStudentGroups from "./tools/list-student-groups";
import listRubrics from "./tools/list-rubrics";

// The OAuth issuer MUST be the direct Supabase host, built from the project
// ref (VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time — keeps this
// file import-safe with no runtime env reads).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "authentic-learning-studio-mcp",
  title: "Authentic Learning Studio",
  version: "0.1.0",
  instructions:
    "Tools for the Authentic Learning Studio. Use list_lessons and get_lesson to read the signed-in teacher's differentiated lessons, list_student_groups to inspect their student groups, and list_rubrics for saved rubrics.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listLessons, getLesson, listStudentGroups, listRubrics],
});