import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Cpu, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CostSummary {
  totalCost: number;
  totalTokens: number;
  costByFunction: { name: string; cost: number; calls: number }[];
  costByDay: { date: string; cost: number }[];
  audioCost: number;
  audioCharacters: number;
}

export function AdminCosts() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostData();
  }, []);

  async function fetchCostData() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ai_cost_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Fetch audio costs
      const { data: audioData } = await supabase
        .from('audio_usage')
        .select('characters_used, estimated_cost');

      const audioCost = audioData?.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0) || 0;
      const audioCharacters = audioData?.reduce((sum, row) => sum + (row.characters_used || 0), 0) || 0;

      if (!data || data.length === 0) {
        setSummary({
          totalCost: audioCost,
          totalTokens: 0,
          costByFunction: audioCost > 0 ? [{ name: 'Audio (ElevenLabs)', cost: audioCost, calls: audioData?.length || 0 }] : [],
          costByDay: [],
          audioCost,
          audioCharacters
        });
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalCost = data.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0) + audioCost;
      const totalTokens = data.reduce((sum, row) => 
        sum + (row.input_tokens || 0) + (row.output_tokens || 0), 0
      );

      // Group by function
      const functionMap = new Map<string, { cost: number; calls: number }>();
      data.forEach(row => {
        const name = row.function_name || 'Unknown';
        const existing = functionMap.get(name) || { cost: 0, calls: 0 };
        functionMap.set(name, {
          cost: existing.cost + Number(row.estimated_cost || 0),
          calls: existing.calls + 1
        });
      });

      // Add audio as a function
      if (audioCost > 0) {
        functionMap.set('Audio (ElevenLabs)', { cost: audioCost, calls: audioData?.length || 0 });
      }

      const costByFunction = Array.from(functionMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.cost - a.cost);

      // Group by day
      const dayMap = new Map<string, number>();
      data.forEach(row => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + Number(row.estimated_cost || 0));
      });

      const costByDay = Array.from(dayMap.entries())
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);

      setSummary({ totalCost, totalTokens, costByFunction, costByDay, audioCost, audioCharacters });
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getAvgCostPerLesson = () => {
    const diff = summary?.costByFunction.find(f => f.name.includes('differentiate'));
    if (diff && diff.calls > 0) {
      return (diff.cost / diff.calls).toFixed(4);
    }
    return '0.0000';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">AI Cost Tracking</h2>
          <p className="text-muted-foreground">Monitor AI API spending</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCostData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(summary?.totalCost || 0).toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary?.totalTokens || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Input + Output</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Lesson</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getAvgCostPerLesson()}
            </div>
            <p className="text-xs text-muted-foreground">Per differentiation</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost by Function */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Function</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.costByFunction.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No cost data yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Avg/Call</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary?.costByFunction.map((func) => (
                    <TableRow key={func.name}>
                      <TableCell>
                        <Badge variant="outline">{func.name}</Badge>
                      </TableCell>
                      <TableCell>{func.calls}</TableCell>
                      <TableCell className="font-mono">
                        ${func.cost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono">
                        ${(func.cost / func.calls).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.costByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
            ) : (
              <div className="space-y-3">
                {summary?.costByDay.map((day) => {
                  const maxCost = Math.max(...(summary?.costByDay.map(d => d.cost) || [1]));
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm w-24 text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(day.cost / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-20 text-right">
                        ${day.cost.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audio Stats */}
      {(summary?.audioCost || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audio Generation (ElevenLabs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${summary?.audioCost.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Characters Used</p>
                <p className="text-2xl font-bold">{summary?.audioCharacters.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
