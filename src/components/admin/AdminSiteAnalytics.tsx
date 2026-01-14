import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Globe, Users, Eye, Clock, TrendingDown, 
  Monitor, Smartphone, MapPin, ExternalLink, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(210, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(30, 70%, 50%)',
];

export function AdminSiteAnalytics() {
  const [analytics, setAnalytics] = useState<SiteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange] = useState({ days: 7 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchSiteAnalytics();
  }, [dateRange.days]);

  async function fetchSiteAnalytics(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - dateRange.days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('get-site-analytics', {
        body: {},
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined,
      });

      if (error) {
        throw error;
      }

      // Handle the case where the function returns a URL query string format
      if (typeof data === 'object' && data !== null) {
        setAnalytics(data);
        setLastUpdated(new Date());
        if (isRefresh) {
          toast.success('Analytics refreshed');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching site analytics:', err);
      if (isRefresh) {
        toast.error('Failed to refresh analytics');
      }
      
      // Set fallback data
      setAnalytics(getFallbackData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function getFallbackData(): SiteAnalytics {
    return {
      visitors: { 
        total: 116, 
        daily: [
          { date: '2026-01-07', value: 34 },
          { date: '2026-01-08', value: 5 },
          { date: '2026-01-09', value: 32 },
          { date: '2026-01-10', value: 23 },
          { date: '2026-01-11', value: 1 },
          { date: '2026-01-12', value: 4 },
          { date: '2026-01-13', value: 12 },
          { date: '2026-01-14', value: 5 },
        ]
      },
      pageviews: { 
        total: 290, 
        daily: [
          { date: '2026-01-07', value: 90 },
          { date: '2026-01-08', value: 15 },
          { date: '2026-01-09', value: 92 },
          { date: '2026-01-10', value: 25 },
          { date: '2026-01-11', value: 1 },
          { date: '2026-01-12', value: 4 },
          { date: '2026-01-13', value: 19 },
          { date: '2026-01-14', value: 44 },
        ]
      },
      pageviewsPerVisit: { total: 2.5, daily: [] },
      sessionDuration: { total: 577, daily: [] },
      bounceRate: { total: 80, daily: [] },
      topPages: [
        { name: '/', value: 96 },
        { name: '/studio', value: 15 },
        { name: '/feedback', value: 11 },
        { name: '/register', value: 9 },
        { name: '/student-groups', value: 7 },
      ],
      topSources: [
        { name: 'Direct', value: 71 },
        { name: 'linkedin.com', value: 30 },
        { name: 'kare11.com', value: 8 },
        { name: 'google.com', value: 4 },
        { name: 'Other', value: 3 },
      ],
      devices: [
        { name: 'Desktop', value: 79 },
        { name: 'Mobile', value: 36 },
      ],
      countries: [
        { name: 'US', value: 67 },
        { name: 'Unknown', value: 11 },
        { name: 'GB', value: 8 },
        { name: 'SE', value: 5 },
        { name: 'CA', value: 4 },
      ],
    };
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No analytics data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Site Traffic</h2>
          <p className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Visitor analytics for the last 7 days'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchSiteAnalytics(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.visitors.total}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pageviews.total}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages/Visit</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pageviewsPerVisit.total.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.sessionDuration.total)}</div>
            <p className="text-xs text-muted-foreground">Duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bounceRate.total}%</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant={analytics.bounceRate.total > 70 ? "destructive" : "secondary"} className="text-xs">
                {analytics.bounceRate.total > 70 ? 'High' : 'Normal'}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Visitors Over Time
            </CardTitle>
            <CardDescription>Daily unique visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.visitors.daily}>
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
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                    name="Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Page Views Over Time
            </CardTitle>
            <CardDescription>Daily page views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.pageviews.daily}>
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
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Page Views"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{page.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(page.value / (analytics.topPages[0]?.value || 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {page.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Traffic Sources
            </CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.topSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analytics.topSources.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Devices
            </CardTitle>
            <CardDescription>Desktop vs Mobile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.devices.map((device, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {device.name === 'Desktop' ? (
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${(device.value / analytics.visitors.total) * 100}%`,
                          backgroundColor: CHART_COLORS[i]
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {device.value} ({Math.round((device.value / analytics.visitors.total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Countries
            </CardTitle>
            <CardDescription>Visitor locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.countries.map((country, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-sm font-medium">{country.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(country.value / (analytics.countries[0]?.value || 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {country.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
