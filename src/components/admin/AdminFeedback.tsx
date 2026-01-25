import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Star, ThumbsUp, ThumbsDown, MessageSquare, Users, TrendingUp, Calendar, Download, Search, Eye, CheckCircle, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { format, subDays, isAfter } from "date-fns";
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
  LineChart,
  Line,
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
  recommendation_reason: string | null;
  user_role: string | null;
  years_teaching: number | null;
  grade_levels: string[] | null;
  subject_areas: string[] | null;
  use_cases: string | null;
  success_stories: string | null;
  comparison_to_other_tools: string | null;
  feedback_type: string | null;
  incentive_claimed: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface FeedbackWithUser extends FeedbackEntry {
  user?: UserProfile;
}

interface FeedbackStats {
  totalResponses: number;
  avgSatisfaction: number;
  avgEaseOfUse: number;
  avgFeatures: number;
  recommendRate: number;
  usageBreakdown: { name: string; value: number }[];
  roleBreakdown: { name: string; value: number }[];
  satisfactionTrend: { date: string; avg: number; count: number }[];
  ratingComparison: { name: string; value: number }[];
}

const COLORS = ["#166534", "#7F4F3E", "#D97706", "#2A1E17", "#9CA3AF"];
const ITEMS_PER_PAGE = 20;

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackWithUser[]>([]);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersWithOverride, setUsersWithOverride] = useState<Map<string, { trialEnd: string | null; type: string }>>(new Map());
  
  // Filters
  const [dateRange, setDateRange] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [grantingFreeMonth, setGrantingFreeMonth] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [dateRange]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      // Fetch feedback
      let query = supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateRange !== "all") {
        const daysAgo = subDays(new Date(), parseInt(dateRange));
        query = query.gte("created_at", daysAgo.toISOString());
      }

      const { data: feedbackData, error: feedbackError } = await query;
      if (feedbackError) throw feedbackError;

      // Fetch user profiles for all feedback
      const userIds = [...new Set((feedbackData || []).map((f) => f.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map<string, UserProfile>();
        (profilesData || []).forEach((p) => profileMap.set(p.id, p));
        setProfiles(profileMap);

        // Fetch subscription overrides to show who has been granted free access
        const { data: overridesData } = await supabase
          .from("subscription_overrides")
          .select("user_id, trial_end_date, override_type")
          .in("user_id", userIds);

        const overrideMap = new Map<string, { trialEnd: string | null; type: string }>();
        (overridesData || []).forEach((o) => overrideMap.set(o.user_id, { 
          trialEnd: o.trial_end_date, 
          type: o.override_type 
        }));
        setUsersWithOverride(overrideMap);
      }

      const feedbackWithUsers = (feedbackData || []).map((f) => ({
        ...f,
        user: profiles.get(f.user_id),
      }));

      setFeedback(feedbackWithUsers);
      calculateStats(feedbackData || []);
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

    const avgSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
      : 0;
    const avgEaseOfUse = easeScores.length > 0 
      ? easeScores.reduce((a, b) => a + b, 0) / easeScores.length 
      : 0;
    const avgFeatures = featureScores.length > 0 
      ? featureScores.reduce((a, b) => a + b, 0) / featureScores.length 
      : 0;

    setStats({
      totalResponses: data.length,
      avgSatisfaction,
      avgEaseOfUse,
      avgFeatures,
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
        .slice(-14)
        .map(([date, scores]) => ({
          date,
          avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
          count: scores.length,
        })),
      ratingComparison: [
        { name: "Satisfaction", value: Math.round(avgSatisfaction * 10) / 10 },
        { name: "Ease of Use", value: Math.round(avgEaseOfUse * 10) / 10 },
        { name: "Features", value: Math.round(avgFeatures * 10) / 10 },
      ],
    });
  };

  // Filtered and paginated data
  const filteredFeedback = useMemo(() => {
    let result = feedback.map((f) => ({
      ...f,
      user: profiles.get(f.user_id),
    }));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => 
        f.user?.full_name?.toLowerCase().includes(query) ||
        f.user?.email?.toLowerCase().includes(query) ||
        f.missing_features?.toLowerCase().includes(query) ||
        f.pain_points?.toLowerCase().includes(query) ||
        f.favorite_features?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [feedback, profiles, searchQuery]);

  const paginatedFeedback = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFeedback.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFeedback, currentPage]);

  const totalPages = Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE);

  const exportToCSV = () => {
    const headers = [
      "Date", "User Name", "Email", "Usage Frequency", "Overall Satisfaction",
      "Ease of Use", "Feature Completeness", "Would Recommend", "User Role",
      "Years Teaching", "Grade Levels", "Subject Areas", "Favorite Features",
      "Pain Points", "Missing Features", "Improvement Suggestions", "Use Cases"
    ];

    const rows = feedback.map((f) => [
      format(new Date(f.created_at), "yyyy-MM-dd HH:mm"),
      profiles.get(f.user_id)?.full_name || "Unknown",
      profiles.get(f.user_id)?.email || "Unknown",
      f.usage_frequency,
      f.overall_satisfaction || "",
      f.ease_of_use || "",
      f.feature_completeness || "",
      f.would_recommend === null ? "" : f.would_recommend ? "Yes" : "No",
      f.user_role || "",
      f.years_teaching || "",
      f.grade_levels?.join("; ") || "",
      f.subject_areas?.join("; ") || "",
      `"${(f.favorite_features || "").replace(/"/g, '""')}"`,
      `"${(f.pain_points || "").replace(/"/g, '""')}"`,
      `"${(f.missing_features || "").replace(/"/g, '""')}"`,
      `"${(f.improvement_suggestions || "").replace(/"/g, '""')}"`,
      `"${(f.use_cases || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `feedback-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
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

  const openDetailModal = (entry: FeedbackWithUser) => {
    setSelectedFeedback({
      ...entry,
      user: profiles.get(entry.user_id),
    });
    setDetailModalOpen(true);
  };

  const grantFreeMonth = async (userId: string, feedbackId: string) => {
    setGrantingFreeMonth(feedbackId);
    try {
      // Get current user for created_by field
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // Get user profile for email
      const userProfile = profiles.get(userId);
      if (!userProfile?.email) {
        throw new Error("User email not found");
      }

      // Check if user already has an override
      const { data: existingOverride } = await supabase
        .from("subscription_overrides")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      let finalTrialEnd: Date;

      if (existingOverride) {
        // Extend existing trial by 30 days from current trial_end or now
        const currentEnd = existingOverride.trial_end_date 
          ? new Date(existingOverride.trial_end_date) 
          : new Date();
        finalTrialEnd = addDays(currentEnd > new Date() ? currentEnd : new Date(), 30);
        
        const { error } = await supabase
          .from("subscription_overrides")
          .update({
            trial_end_date: finalTrialEnd.toISOString(),
            notes: `Extended 30 days for feedback on ${format(new Date(), "yyyy-MM-dd")}. ${existingOverride.notes || ""}`
          })
          .eq("id", existingOverride.id);

        if (error) throw error;
      } else {
        // Create new override with 30-day trial
        finalTrialEnd = addDays(new Date(), 30);
        const { error } = await supabase
          .from("subscription_overrides")
          .insert({
            user_id: userId,
            override_type: "trial",
            trial_end_date: finalTrialEnd.toISOString(),
            created_by: currentUser.id,
            notes: `Granted 30-day free access for feedback on ${format(new Date(), "yyyy-MM-dd")}`
          });

        if (error) throw error;
      }

      // Send thank-you email
      try {
        await supabase.functions.invoke("send-free-month-email", {
          body: {
            email: userProfile.email,
            userName: userProfile.full_name,
            trialEndDate: finalTrialEnd.toISOString(),
          },
        });
      } catch (emailError) {
        console.error("Failed to send thank-you email:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Free Month Granted!",
        description: "User now has 30 days of free access and has been sent a thank-you email.",
      });

      // Refresh feedback list
      fetchFeedback();
    } catch (err) {
      console.error("Error granting free month:", err);
      toast({
        title: "Error",
        description: "Failed to grant free month. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGrantingFreeMonth(null);
    }
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
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Feedback Analytics</h2>
          <p className="text-muted-foreground">Analyze user feedback and insights</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV} disabled={feedback.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResponses}</div>
              <p className="text-xs text-muted-foreground">feedback submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSatisfaction.toFixed(1)}/5.0</div>
              <p className="text-xs text-muted-foreground">overall rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Would Recommend</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recommendRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">net promoter score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Ease of Use</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgEaseOfUse.toFixed(1)}/5.0</div>
              <p className="text-xs text-muted-foreground">usability rating</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {stats && stats.totalResponses > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Satisfaction Over Time */}
          {stats.satisfactionTrend.length > 1 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Satisfaction Over Time</CardTitle>
                <CardDescription>Average satisfaction score trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === "avg" ? `${value}/5` : value,
                        name === "avg" ? "Avg Rating" : "Responses"
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="#166534" 
                      strokeWidth={2}
                      dot={{ fill: "#166534" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Rating Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Ratings Comparison</CardTitle>
              <CardDescription>Average ratings by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.ratingComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value: number) => [`${value}/5`, "Rating"]} />
                  <Bar dataKey="value" fill="#166534" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Usage Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Frequency</CardTitle>
              <CardDescription>How often users use the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.usageBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
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

          {/* User Roles */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.roleBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.roleBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommendation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendation Breakdown</CardTitle>
              <CardDescription>Would recommend to colleagues</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Yes", value: feedback.filter(f => f.would_recommend === true).length },
                      { name: "No", value: feedback.filter(f => f.would_recommend === false).length },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#166534" />
                    <Cell fill="#DC2626" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Feedback ({filteredFeedback.length})</CardTitle>
              <CardDescription>Browse individual feedback submissions</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No feedback found.</p>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Satisfaction</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Recommend</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedFeedback.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-sm">
                                {profiles.get(entry.user_id)?.full_name || "Unknown User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {profiles.get(entry.user_id)?.email || ""}
                              </p>
                            </div>
                            {usersWithOverride.has(entry.user_id) && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs shrink-0">
                                <Gift className="h-3 w-3 mr-1" />
                                {usersWithOverride.get(entry.user_id)?.type === "permanent" 
                                  ? "Permanent" 
                                  : `Free until ${format(new Date(usersWithOverride.get(entry.user_id)?.trialEnd || ""), "MMM dd")}`}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(entry.created_at), "MMM dd, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(entry.overall_satisfaction)}
                        </td>
                        <td className="px-4 py-3">
                          {entry.would_recommend !== null && (
                            entry.would_recommend ? (
                              <Badge className="bg-green-100 text-green-800">
                                <ThumbsUp className="h-3 w-3 mr-1" /> Yes
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <ThumbsDown className="h-3 w-3 mr-1" /> No
                              </Badge>
                            )
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {entry.user_role && (
                            <Badge variant="outline">
                              {entry.user_role.charAt(0).toUpperCase() + entry.user_role.slice(1)}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => grantFreeMonth(entry.user_id, entry.id)}
                              disabled={grantingFreeMonth === entry.id}
                              className="text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              {grantingFreeMonth === entry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Gift className="h-4 w-4 mr-1" />
                                  Free Month
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailModal(entry)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredFeedback.length)} of{" "}
                    {filteredFeedback.length} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedFeedback && format(new Date(selectedFeedback.created_at), "MMMM dd, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">User Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedFeedback.user?.full_name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedFeedback.user?.email || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{selectedFeedback.user_role || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Experience</p>
                    <p className="font-medium">
                      {selectedFeedback.years_teaching ? `${selectedFeedback.years_teaching} years` : "N/A"}
                    </p>
                  </div>
                </div>
                {(selectedFeedback.grade_levels?.length || selectedFeedback.subject_areas?.length) && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {selectedFeedback.grade_levels?.map((g) => (
                      <Badge key={g} variant="outline">{g}</Badge>
                    ))}
                    {selectedFeedback.subject_areas?.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Ratings */}
              <div>
                <h4 className="font-medium mb-3">Ratings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Satisfaction</p>
                    {renderStars(selectedFeedback.overall_satisfaction)}
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Ease of Use</p>
                    {renderStars(selectedFeedback.ease_of_use)}
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Features</p>
                    {renderStars(selectedFeedback.feature_completeness)}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm">Would Recommend:</span>
                  {selectedFeedback.would_recommend !== null && (
                    selectedFeedback.would_recommend ? (
                      <Badge className="bg-green-100 text-green-800">
                        <ThumbsUp className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <ThumbsDown className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {/* Open-ended Responses */}
              <div className="space-y-4">
                <h4 className="font-medium">Detailed Feedback</h4>
                
                {selectedFeedback.favorite_features && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-800 mb-1">Favorite Features</p>
                    <p className="text-sm">{selectedFeedback.favorite_features}</p>
                  </div>
                )}

                {selectedFeedback.pain_points && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-medium text-red-800 mb-1">Pain Points</p>
                    <p className="text-sm">{selectedFeedback.pain_points}</p>
                  </div>
                )}

                {selectedFeedback.missing_features && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-800 mb-1">Missing Features</p>
                    <p className="text-sm">{selectedFeedback.missing_features}</p>
                  </div>
                )}

                {selectedFeedback.improvement_suggestions && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-800 mb-1">Improvement Suggestions</p>
                    <p className="text-sm">{selectedFeedback.improvement_suggestions}</p>
                  </div>
                )}

                {selectedFeedback.use_cases && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Use Cases</p>
                    <p className="text-sm">{selectedFeedback.use_cases}</p>
                  </div>
                )}

                {selectedFeedback.success_stories && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Success Stories</p>
                    <p className="text-sm">{selectedFeedback.success_stories}</p>
                  </div>
                )}

                {selectedFeedback.comparison_to_other_tools && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Comparison to Other Tools</p>
                    <p className="text-sm">{selectedFeedback.comparison_to_other_tools}</p>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedFeedback.usage_frequency}</Badge>
                  {selectedFeedback.feedback_type && (
                    <Badge variant="secondary">{selectedFeedback.feedback_type}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
