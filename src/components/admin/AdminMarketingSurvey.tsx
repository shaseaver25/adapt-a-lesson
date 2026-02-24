import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Search, TrendingUp, Users, Star, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyRow {
  id: string;
  user_id: string | null;
  created_at: string;
  primary_role: string;
  grade_levels: string[];
  usage_duration: string;
  lessons_per_week: string | null;
  features_used: string[];
  time_saved_rating: number | null;
  previous_method: string | null;
  lesson_quality_satisfaction: number | null;
  multilingual_satisfaction: number | null;
  student_impact: string | null;
  nps_score: number | null;
  wcag_adoption_factor: string | null;
  ocr_complaint: string | null;
  most_valuable_thing: string | null;
  improvement_suggestion: string | null;
  incentive_claimed: boolean;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "#f59e0b", "#10b981", "#6366f1"];

const ROLE_LABELS: Record<string, string> = {
  classroom_teacher: "Classroom Teacher",
  esl_ell_specialist: "ESL/ELL Specialist",
  special_education: "Special Ed",
  instructional_coach: "Instructional Coach",
  administrator: "Administrator",
  other: "Other",
};

const FEATURE_LABELS: Record<string, string> = {
  differentiated_lessons: "Differentiated Lessons",
  multilingual_audio: "Multilingual Audio",
  ai_proof_assessments: "AI-Proof Assessments",
  rubric_generation: "Rubric Generation",
  iep_504_accommodations: "IEP/504",
  wcag_compliant_pdfs: "WCAG PDFs",
};

export default function AdminMarketingSurvey() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("marketing_surveys" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        toast({ title: "Error loading surveys", variant: "destructive" });
      } else {
        setSurveys((data as any as SurveyRow[]) || []);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // NPS Calculation
  const npsData = useMemo(() => {
    const withNps = surveys.filter((s) => s.nps_score !== null);
    if (withNps.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    const promoters = withNps.filter((s) => s.nps_score! >= 9).length;
    const detractors = withNps.filter((s) => s.nps_score! <= 6).length;
    const passives = withNps.length - promoters - detractors;
    const score = Math.round(((promoters - detractors) / withNps.length) * 100);
    return { score, promoters, passives, detractors, total: withNps.length };
  }, [surveys]);

  const avgTimeSaved = useMemo(() => {
    const rated = surveys.filter((s) => s.time_saved_rating && s.time_saved_rating > 0);
    if (rated.length === 0) return 0;
    return (rated.reduce((sum, s) => sum + s.time_saved_rating!, 0) / rated.length).toFixed(1);
  }, [surveys]);

  const featureData = useMemo(() => {
    const counts: Record<string, number> = {};
    surveys.forEach((s) => s.features_used?.forEach((f) => { counts[f] = (counts[f] || 0) + 1; }));
    return Object.entries(counts).map(([key, count]) => ({ name: FEATURE_LABELS[key] || key, count })).sort((a, b) => b.count - a.count);
  }, [surveys]);

  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    surveys.forEach((s) => { counts[s.primary_role] = (counts[s.primary_role] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: ROLE_LABELS[key] || key, value }));
  }, [surveys]);

  const studentImpactData = useMemo(() => {
    const counts: Record<string, number> = { yes: 0, no: 0, too_early: 0 };
    surveys.forEach((s) => { if (s.student_impact && counts[s.student_impact] !== undefined) counts[s.student_impact]++; });
    return [
      { name: "Yes", value: counts.yes },
      { name: "No", value: counts.no },
      { name: "Too Early", value: counts.too_early },
    ].filter((d) => d.value > 0);
  }, [surveys]);

  const wcagData = useMemo(() => {
    const counts: Record<string, number> = {};
    surveys.forEach((s) => { if (s.wcag_adoption_factor) counts[s.wcag_adoption_factor] = (counts[s.wcag_adoption_factor] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: key.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase()), value }));
  }, [surveys]);

  const exportCSV = () => {
    const headers = ["Date", "Role", "Grade Levels", "Usage Duration", "Lessons/Week", "Features Used", "Time Saved (1-10)", "Previous Method", "Lesson Quality (1-5)", "Multilingual (1-5)", "Student Impact", "NPS (0-10)", "WCAG Factor", "OCR Complaint", "Most Valuable", "Improvement Suggestion"];
    const rows = surveys.map((s) => [
      new Date(s.created_at).toLocaleDateString(),
      ROLE_LABELS[s.primary_role] || s.primary_role,
      s.grade_levels?.join("; ") || "",
      s.usage_duration || "",
      s.lessons_per_week || "",
      s.features_used?.map((f) => FEATURE_LABELS[f] || f).join("; ") || "",
      s.time_saved_rating ?? "",
      s.previous_method || "",
      s.lesson_quality_satisfaction ?? "",
      s.multilingual_satisfaction ?? "",
      s.student_impact || "",
      s.nps_score ?? "",
      s.wcag_adoption_factor || "",
      s.ocr_complaint || "",
      `"${(s.most_valuable_thing || "").replace(/"/g, '""')}"`,
      `"${(s.improvement_suggestion || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-surveys-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = surveys.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (ROLE_LABELS[s.primary_role] || s.primary_role).toLowerCase().includes(q) ||
      s.most_valuable_thing?.toLowerCase().includes(q) ||
      s.improvement_suggestion?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> NPS Score</CardDescription>
            <CardTitle className={`text-3xl ${npsData.score >= 50 ? "text-green-500" : npsData.score >= 0 ? "text-yellow-500" : "text-destructive"}`}>
              {npsData.total > 0 ? npsData.score : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {npsData.promoters} promoters · {npsData.passives} passives · {npsData.detractors} detractors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Users className="h-3 w-3" /> Total Responses</CardDescription>
            <CardTitle className="text-3xl">{surveys.length}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{surveys.filter((s) => s.incentive_claimed).length} claimed incentive</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> Avg Time Saved</CardDescription>
            <CardTitle className="text-3xl">{avgTimeSaved}<span className="text-lg text-muted-foreground">/10</span></CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Self-reported weekly time savings</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Star className="h-3 w-3" /> Avg Lesson Quality</CardDescription>
            <CardTitle className="text-3xl">
              {surveys.filter((s) => s.lesson_quality_satisfaction).length > 0
                ? (surveys.filter((s) => s.lesson_quality_satisfaction).reduce((sum, s) => sum + s.lesson_quality_satisfaction!, 0) / surveys.filter((s) => s.lesson_quality_satisfaction).length).toFixed(1)
                : "—"}
              <span className="text-lg text-muted-foreground">/5</span>
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Lesson quality satisfaction</p></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {featureData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featureData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {studentImpactData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={studentImpactData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {studentImpactData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">WCAG Compliance as Adoption Factor</CardTitle>
            <CardDescription>Enterprise sales insight</CardDescription>
          </CardHeader>
          <CardContent>
            {wcagData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={wcagData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {wcagData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base">All Responses</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-64" />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={surveys.length === 0}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>NPS</TableHead>
                <TableHead>Time Saved</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {surveys.length === 0 ? "No survey responses yet" : "No matching results"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[s.primary_role] || s.primary_role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.nps_score !== null && s.nps_score >= 9 ? "default" : s.nps_score !== null && s.nps_score <= 6 ? "destructive" : "secondary"}>
                        {s.nps_score ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.time_saved_rating ?? "—"}/10</TableCell>
                    <TableCell>{s.lesson_quality_satisfaction ?? "—"}/5</TableCell>
                    <TableCell className="capitalize">{s.student_impact?.replace("_", " ") || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSurvey(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedSurvey} onOpenChange={() => setSelectedSurvey(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Response Detail</DialogTitle>
          </DialogHeader>
          {selectedSurvey && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Date:</span> {new Date(selectedSurvey.created_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Role:</span> {ROLE_LABELS[selectedSurvey.primary_role] || selectedSurvey.primary_role}</div>
                <div><span className="text-muted-foreground">Grade Levels:</span> {selectedSurvey.grade_levels?.join(", ") || "—"}</div>
                <div><span className="text-muted-foreground">Usage Duration:</span> {selectedSurvey.usage_duration || "—"}</div>
                <div><span className="text-muted-foreground">Lessons/Week:</span> {selectedSurvey.lessons_per_week || "—"}</div>
                <div><span className="text-muted-foreground">Previous Method:</span> {selectedSurvey.previous_method || "—"}</div>
                <div><span className="text-muted-foreground">Time Saved:</span> {selectedSurvey.time_saved_rating ?? "—"}/10</div>
                <div><span className="text-muted-foreground">NPS Score:</span> <Badge variant={selectedSurvey.nps_score !== null && selectedSurvey.nps_score >= 9 ? "default" : "secondary"}>{selectedSurvey.nps_score ?? "—"}</Badge></div>
                <div><span className="text-muted-foreground">Lesson Quality:</span> {selectedSurvey.lesson_quality_satisfaction ?? "—"}/5</div>
                <div><span className="text-muted-foreground">Multilingual:</span> {selectedSurvey.multilingual_satisfaction ?? "—"}/5</div>
                <div><span className="text-muted-foreground">Student Impact:</span> {selectedSurvey.student_impact || "—"}</div>
                <div><span className="text-muted-foreground">WCAG Factor:</span> {selectedSurvey.wcag_adoption_factor || "—"}</div>
                <div><span className="text-muted-foreground">OCR Complaint:</span> {selectedSurvey.ocr_complaint || "—"}</div>
                <div><span className="text-muted-foreground">Incentive:</span> {selectedSurvey.incentive_claimed ? "Claimed" : "No"}</div>
              </div>
              <div><span className="text-muted-foreground">Features Used:</span> {selectedSurvey.features_used?.map((f) => FEATURE_LABELS[f] || f).join(", ") || "—"}</div>
              <div>
                <span className="text-muted-foreground block mb-1">Most Valuable Thing:</span>
                <p className="bg-muted/50 p-3 rounded-md">{selectedSurvey.most_valuable_thing || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Improvement Suggestion:</span>
                <p className="bg-muted/50 p-3 rounded-md">{selectedSurvey.improvement_suggestion || "—"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
