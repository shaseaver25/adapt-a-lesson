import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSiteAnalytics } from './AdminSiteAnalytics';
import { Globe, FileText } from 'lucide-react';

interface DailyMetric {
  date: string;
  lessons: number;
  rubrics: number;
  audioUsage: number;
}

export function AdminAnalytics() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      // Get lessons by date
      const { data: lessons } = await supabase
        .from('generated_lessons')
        .select('created_at')
        .order('created_at', { ascending: true });

      // Get rubrics by date
      const { data: rubrics } = await supabase
        .from('generated_rubrics')
        .select('created_at')
        .order('created_at', { ascending: true });

      // Get audio usage by date
      const { data: audioUsage } = await supabase
        .from('audio_usage')
        .select('created_at, characters_used')
        .order('created_at', { ascending: true });

      // Aggregate by date
      const dateMap = new Map<string, DailyMetric>();

      const addToDate = (dateStr: string, field: 'lessons' | 'rubrics' | 'audioUsage', value: number = 1) => {
        const date = new Date(dateStr).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, lessons: 0, rubrics: 0, audioUsage: 0 });
        }
        const entry = dateMap.get(date)!;
        entry[field] += value;
      };

      lessons?.forEach(l => addToDate(l.created_at, 'lessons'));
      rubrics?.forEach(r => addToDate(r.created_at, 'rubrics'));
      audioUsage?.forEach(a => addToDate(a.created_at, 'audioUsage', a.characters_used));

      // Convert to array and sort
      const metricsArray = Array.from(dateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      setMetrics(metricsArray);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="site" className="space-y-6">
        <TabsList>
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site Traffic
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Platform Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <AdminSiteAnalytics />
        </TabsContent>

        <TabsContent value="usage">
          <UsageAnalytics metrics={metrics} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsageAnalytics({ metrics, loading }: { metrics: DailyMetric[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 animate-pulse bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Platform Usage</h2>
        <p className="text-muted-foreground">Content generation over the last 30 days</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Generation</CardTitle>
            <CardDescription>Lessons and rubrics created per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="lessons" fill="hsl(var(--primary))" name="Lessons" />
                  <Bar dataKey="rubrics" fill="hsl(var(--secondary))" name="Rubrics" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Usage</CardTitle>
            <CardDescription>TTS characters used per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value.toLocaleString(), 'Characters']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="audioUsage" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {metrics.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No analytics data available yet. Data will appear as the platform is used.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
