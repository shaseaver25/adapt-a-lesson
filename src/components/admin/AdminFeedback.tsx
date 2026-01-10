import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Star, ThumbsUp, ThumbsDown, MessageSquare, Users, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface FeedbackEntry {
  id: string;
  user_id: string;
  usage_frequency: string;
  overall_satisfaction: number | null;
  ease_of_use: number | null;
  feature_completeness: number | null;
  favorite_features: string | null;
  pain_points: string | null;
  missing_features: string | null;
  improvement_suggestions: string | null;
  would_recommend: boolean | null;
  user_role: string | null;
  years_teaching: number | null;
  grade_levels: string[] | null;
  subject_areas: string[] | null;
  use_cases: string | null;
  created_at: string;
}

interface FeedbackStats {
  totalResponses: number;
  avgSatisfaction: number;
  avgEaseOfUse: number;
  avgFeatures: number;
  recommendRate: number;
  usageBreakdown: { name: string; value: number }[];
  roleBreakdown: { name: string; value: number }[];
  satisfactionTrend: { date: string; avg: number }[];
}

const COLORS = ["#166534", "#7F4F3E", "#D97706", "#2A1E17", "#9CA3AF"];

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFeedback(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: FeedbackEntry[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const satisfactionScores = data.filter((d) => d.overall_satisfaction).map((d) => d.overall_satisfaction!);
    const easeScores = data.filter((d) => d.ease_of_use).map((d) => d.ease_of_use!);
    const featureScores = data.filter((d) => d.feature_completeness).map((d) => d.feature_completeness!);
    const recommendations = data.filter((d) => d.would_recommend !== null);

    const usageCount: Record<string, number> = {};
    data.forEach((d) => {
      usageCount[d.usage_frequency] = (usageCount[d.usage_frequency] || 0) + 1;
    });

    const roleCount: Record<string, number> = {};
    data.forEach((d) => {
      if (d.user_role) {
        roleCount[d.user_role] = (roleCount[d.user_role] || 0) + 1;
      }
    });

    // Group by date for trend
    const byDate: Record<string, number[]> = {};
    data.forEach((d) => {
      if (d.overall_satisfaction) {
        const date = format(new Date(d.created_at), "MMM dd");
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(d.overall_satisfaction);
      }
    });

    setStats({
      totalResponses: data.length,
      avgSatisfaction: satisfactionScores.length > 0 
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
        : 0,
      avgEaseOfUse: easeScores.length > 0 
        ? easeScores.reduce((a, b) => a + b, 0) / easeScores.length 
        : 0,
      avgFeatures: featureScores.length > 0 
        ? featureScores.reduce((a, b) => a + b, 0) / featureScores.length 
        : 0,
      recommendRate: recommendations.length > 0
        ? (recommendations.filter((d) => d.would_recommend).length / recommendations.length) * 100
        : 0,
      usageBreakdown: Object.entries(usageCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
      roleBreakdown: Object.entries(roleCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
      satisfactionTrend: Object.entries(byDate)
        .slice(-7)
        .map(([date, scores]) => ({
          date,
          avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        })),
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">N/A</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResponses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSatisfaction.toFixed(1)}/5</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Ease of Use</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgEaseOfUse.toFixed(1)}/5</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Features</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgFeatures.toFixed(1)}/5</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Would Recommend</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recommendRate.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {stats && stats.totalResponses > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Usage Frequency</CardTitle>
              <CardDescription>How often users use the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.usageBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.usageBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.roleBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#166534" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedback ({feedback.length})</CardTitle>
          <CardDescription>Browse individual feedback submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No feedback submitted yet.</p>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {feedback.map((entry) => (
                  <Card key={entry.id} className="bg-muted/50">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.created_at), "MMM dd, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{entry.usage_frequency}</Badge>
                          {entry.user_role && (
                            <Badge variant="secondary">{entry.user_role}</Badge>
                          )}
                          {entry.would_recommend !== null && (
                            entry.would_recommend ? (
                              <Badge className="bg-green-100 text-green-800">
                                <ThumbsUp className="h-3 w-3 mr-1" /> Recommends
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <ThumbsDown className="h-3 w-3 mr-1" /> No Recommend
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Satisfaction</p>
                          {renderStars(entry.overall_satisfaction)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Ease of Use</p>
                          {renderStars(entry.ease_of_use)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Features</p>
                          {renderStars(entry.feature_completeness)}
                        </div>
                      </div>

                      {entry.favorite_features && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Favorite Features</p>
                          <p className="text-sm">{entry.favorite_features}</p>
                        </div>
                      )}

                      {entry.pain_points && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Pain Points</p>
                          <p className="text-sm text-destructive">{entry.pain_points}</p>
                        </div>
                      )}

                      {entry.missing_features && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Missing Features</p>
                          <p className="text-sm text-amber-600">{entry.missing_features}</p>
                        </div>
                      )}

                      {entry.improvement_suggestions && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Suggestions</p>
                          <p className="text-sm">{entry.improvement_suggestions}</p>
                        </div>
                      )}

                      {entry.use_cases && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Use Cases</p>
                          <p className="text-sm">{entry.use_cases}</p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {entry.grade_levels?.map((grade) => (
                          <Badge key={grade} variant="outline" className="text-xs">
                            {grade}
                          </Badge>
                        ))}
                        {entry.subject_areas?.map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {entry.years_teaching && (
                          <Badge variant="outline" className="text-xs">
                            {entry.years_teaching} years exp
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
