import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CostSummary {
  function_name: string;
  total_cost: number;
  total_calls: number;
}

interface RecentCostLog {
  id: string;
  function_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

export function AdminCosts() {
  const [costSummary, setCostSummary] = useState<CostSummary[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentCostLog[]>([]);
  const [audioStats, setAudioStats] = useState({ totalCost: 0, totalCharacters: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCosts();
  }, []);

  async function fetchCosts() {
    try {
      // Fetch AI cost logs
      const { data: aiLogs } = await supabase
        .from('ai_cost_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Aggregate by function
      const functionMap = new Map<string, CostSummary>();
      aiLogs?.forEach(log => {
        const existing = functionMap.get(log.function_name) || {
          function_name: log.function_name,
          total_cost: 0,
          total_calls: 0,
        };
        existing.total_cost += Number(log.estimated_cost);
        existing.total_calls += 1;
        functionMap.set(log.function_name, existing);
      });

      setCostSummary(Array.from(functionMap.values()));
      setRecentLogs(aiLogs || []);

      // Fetch audio costs
      const { data: audioData } = await supabase
        .from('audio_usage')
        .select('characters_used, estimated_cost');

      const totalAudioCost = audioData?.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0) || 0;
      const totalCharacters = audioData?.reduce((sum, row) => sum + (row.characters_used || 0), 0) || 0;

      setAudioStats({ totalCost: totalAudioCost, totalCharacters });
    } catch (error) {
      console.error('Error fetching costs:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalAICost = costSummary.reduce((sum, item) => sum + item.total_cost, 0);
  const totalCost = totalAICost + audioStats.totalCost;

  const pieData = [
    ...costSummary.map(item => ({
      name: item.function_name,
      value: item.total_cost,
    })),
    { name: 'Audio (ElevenLabs)', value: audioStats.totalCost },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">AI Cost Tracking</h2>
        <p className="text-muted-foreground">Monitor AI API spending</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total AI Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">All-time estimated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Audio Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${audioStats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">{audioStats.totalCharacters.toLocaleString()} characters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LLM Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAICost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">{costSummary.reduce((sum, item) => sum + item.total_calls, 0)} API calls</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
            <CardDescription>Breakdown by service</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No cost data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent API Calls</CardTitle>
            <CardDescription>Last 50 logged calls</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Function</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.function_name}</TableCell>
                        <TableCell className="text-sm">{log.model}</TableCell>
                        <TableCell className="text-sm">${Number(log.estimated_cost).toFixed(6)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No API calls logged yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
