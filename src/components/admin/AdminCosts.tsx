import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, RefreshCw, RotateCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PRICING_TIERS, computeLessonStats, computeAudioStats, marginColorClass,
  type LessonCostRow, type AudioRow, type LessonStats, type AudioStats,
} from '@/lib/admin/costAnalytics';

interface Summary {
  lessons: LessonStats;
  audio: AudioStats;
  rows: LessonCostRow[];
  costByFunction: { name: string; cost: number; calls: number }[];
  costByDay: { date: string; cost: number }[];
}

const fmt = (n: number, d = 4) => `$${n.toFixed(d)}`;

export function AdminCosts() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCostData(); }, []);

  async function fetchCostData() {
    setLoading(true);
    try {
      const [{ data: allRows }, { data: audioRows }] = await Promise.all([
        supabase.from('ai_cost_logs').select('*').order('created_at', { ascending: false }).limit(2000),
        supabase.from('audio_usage').select('lesson_id, characters_used, estimated_cost, language'),
      ]);
      const rows = (allRows || []) as unknown as (LessonCostRow & { function_name: string })[];
      const lessonRows = rows.filter(r => r.function_name === 'differentiate-lesson') as LessonCostRow[];
      const audio = computeAudioStats((audioRows || []) as AudioRow[]);
      const lessons = computeLessonStats(lessonRows);

      // Cost by function (all functions in ai_cost_logs + audio)
      const fnMap = new Map<string, { cost: number; calls: number }>();
      rows.forEach(r => {
        const name = r.function_name || 'Unknown';
        const prev = fnMap.get(name) || { cost: 0, calls: 0 };
        fnMap.set(name, { cost: prev.cost + (Number(r.estimated_cost) || 0), calls: prev.calls + 1 });
      });
      if (audio.totalCost > 0) {
        fnMap.set('Audio (ElevenLabs)', { cost: audio.totalCost, calls: audioRows?.length || 0 });
      }
      const costByFunction = Array.from(fnMap.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.cost - a.cost);

      // Last 7 days
      const dayMap = new Map<string, number>();
      rows.forEach(r => {
        const date = new Date(r.created_at).toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + (Number(r.estimated_cost) || 0));
      });
      const costByDay = Array.from(dayMap.entries())
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);

      setSummary({ lessons, audio, rows: lessonRows, costByFunction, costByDay });
    } catch (e) {
      console.error('Error fetching cost data:', e);
    } finally { setLoading(false); }
  }

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-16 mt-2" />
            </CardHeader></Card>
          ))}
        </div>
      </div>
    );
  }

  const { lessons, audio, costByFunction, costByDay } = summary;
  const noLessons = lessons.count === 0;

  // Scenario all-in costs
  const typicalCost = lessons.flashMedian + audio.monolingualMedianPerLesson;
  const worstCost = lessons.proP95 + audio.bilingualP95PerLesson;
  const scenarios = [
    { label: 'Text only (Flash, no audio)', cost: lessons.flashMedian },
    { label: 'Typical (text + monolingual audio)', cost: typicalCost },
    { label: 'Worst case (Pro + bilingual audio)', cost: worstCost },
  ];

  const claudeMultiplier = lessons.totalGemini > 0 ? lessons.totalClaude / lessons.totalGemini : 0;

  const renderMarginRow = (label: string, cost: number) =>
    PRICING_TIERS.map(t => {
      const margin = t.pricePerLesson - cost;
      const pct = t.pricePerLesson > 0 ? (margin / t.pricePerLesson) * 100 : 0;
      return (
        <TableRow key={`${label}-${t.name}`}>
          <TableCell className="text-muted-foreground">{label}</TableCell>
          <TableCell><Badge variant="outline">{t.name}</Badge></TableCell>
          <TableCell className="font-mono">{fmt(t.pricePerLesson)}</TableCell>
          <TableCell className="font-mono">{fmt(cost)}</TableCell>
          <TableCell className="font-mono">{fmt(margin)}</TableCell>
          <TableCell className={`font-mono font-semibold ${marginColorClass(pct)}`}>{pct.toFixed(1)}%</TableCell>
        </TableRow>
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">AI Cost Tracking</h2>
          <p className="text-muted-foreground">What does a lesson actually cost us — and what's our margin?</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCostData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* TOP ROW — lesson text cost stats */}
      {noLessons ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          No lesson cost data yet — generate a lesson to populate this.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            title="Median cost / lesson" value={fmt(lessons.medianCost)} sub="Text only (Gemini)" />
          <StatCard icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            title="p95 cost / lesson" value={fmt(lessons.p95Cost)} sub="Worst-case text" />
          <StatCard icon={<RotateCw className="h-4 w-4 text-muted-foreground" />}
            title="Avg regen attempts" value={lessons.avgRegen.toFixed(2)} sub="0 = first try passed" />
          <StatCard icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            title="Model mix" value={`${lessons.pctPro.toFixed(0)}% Pro`}
            sub={`${lessons.proCount} Pro · ${lessons.flashCount} Flash`} />
        </div>
      )}

      {/* All-in cost per lesson scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>All-in cost per lesson (scenarios)</CardTitle>
          <p className="text-xs text-muted-foreground">Audio is optional — only some lessons generate it.</p>
        </CardHeader>
        <CardContent>
          {noLessons ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No lesson cost data yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Scenario</TableHead><TableHead className="text-right">Estimated cost / lesson</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {scenarios.map(s => (
                  <TableRow key={s.label}>
                    <TableCell>{s.label}</TableCell>
                    <TableCell className="font-mono text-right">{fmt(s.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gemini vs Claude */}
      <Card>
        <CardHeader><CardTitle>Gemini vs Claude (what-if)</CardTitle></CardHeader>
        <CardContent>
          {noLessons ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No lesson cost data yet.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total — Gemini (actual)</p>
                  <p className="text-2xl font-bold">{fmt(lessons.totalGemini)}</p>
                  <p className="text-xs text-muted-foreground">Median {fmt(lessons.medianGemini)} / lesson</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total — Claude (estimated)</p>
                  <p className="text-2xl font-bold">{fmt(lessons.totalClaude)}</p>
                  <p className="text-xs text-muted-foreground">Median {fmt(lessons.medianClaude)} / lesson</p>
                </div>
              </div>
              <p className="text-sm font-medium">
                Claude would cost ~{claudeMultiplier.toFixed(1)}× more.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                List-price estimates; actual Lovable gateway billing may differ.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Margin vs Pricing Tiers */}
      <Card>
        <CardHeader><CardTitle>Margin vs pricing tiers</CardTitle>
          <p className="text-xs text-muted-foreground">1 credit = 1 lesson. Green &gt;70% · Amber 40–70% · Red &lt;40%.</p>
        </CardHeader>
        <CardContent>
          {noLessons ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No lesson cost data yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Scenario</TableHead><TableHead>Tier</TableHead>
                <TableHead>Price/lesson</TableHead><TableHead>Cost/lesson</TableHead>
                <TableHead>Margin $</TableHead><TableHead>Margin %</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {renderMarginRow('Typical', typicalCost)}
                {renderMarginRow('Worst case', worstCost)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost by function + Last 7 days */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cost by Function</CardTitle></CardHeader>
          <CardContent>
            {costByFunction.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No cost data yet</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Function</TableHead><TableHead>Calls</TableHead>
                  <TableHead>Total</TableHead><TableHead>Avg</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {costByFunction.map(f => (
                    <TableRow key={f.name}>
                      <TableCell><Badge variant="outline">{f.name}</Badge></TableCell>
                      <TableCell>{f.calls}</TableCell>
                      <TableCell className="font-mono">{fmt(f.cost)}</TableCell>
                      <TableCell className="font-mono">{fmt(f.cost / f.calls)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            {costByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
            ) : (
              <div className="space-y-3">
                {costByDay.map(day => {
                  const maxCost = Math.max(...costByDay.map(d => d.cost), 0.0001);
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm w-24 text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(day.cost / maxCost) * 100}%` }} />
                      </div>
                      <span className="text-sm font-mono w-20 text-right">{fmt(day.cost)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audio summary */}
      {audio.totalCost > 0 && (
        <Card>
          <CardHeader><CardTitle>Audio Generation (ElevenLabs)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Total Cost" value={fmt(audio.totalCost)} />
              <Metric label="Characters Used" value={audio.totalCharacters.toLocaleString()} />
              <Metric label="Lessons with audio" value={audio.perLessonCount.toString()} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

