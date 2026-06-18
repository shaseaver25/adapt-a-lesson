// Cost analytics helpers for the Admin "AI Cost Tracking" page.
// Pure functions — no React, no Supabase. Easy to unit-test later.

export interface LessonCostRow {
  model: string | null;
  estimated_cost: number | null;
  claude_estimated_cost: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AudioRow {
  lesson_id: string | null;
  estimated_cost: number | null;
  characters_used: number | null;
  language: string | null;
}

export interface PricingTier {
  name: string;
  monthlyPrice: number;
  creditsPerMonth: number;
  pricePerLesson: number;
}

export const PRICING_TIERS: PricingTier[] = [
  { name: 'Individual', monthlyPrice: 19,   creditsPerMonth: 60,   pricePerLesson: 19 / 60 },
  { name: 'School',     monthlyPrice: 149,  creditsPerMonth: 600,  pricePerLesson: 149 / 600 },
  { name: 'District',   monthlyPrice: 2000, creditsPerMonth: 6000, pricePerLesson: 2000 / 6000 },
];

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export const median = (values: number[]) => percentile(values, 50);

export interface LessonStats {
  count: number;
  proCount: number;
  flashCount: number;
  pctPro: number;
  avgRegen: number;
  medianCost: number;
  p95Cost: number;
  flashMedian: number;
  proP95: number;
  totalGemini: number;
  totalClaude: number;
  medianGemini: number;
  medianClaude: number;
}

export function computeLessonStats(rows: LessonCostRow[]): LessonStats {
  const costs = rows.map(r => Number(r.estimated_cost) || 0);
  const claudeCosts = rows.map(r => Number(r.claude_estimated_cost) || 0);
  const flashCosts = rows.filter(r => r.model === 'google/gemini-2.5-flash').map(r => Number(r.estimated_cost) || 0);
  const proCosts = rows.filter(r => r.model === 'google/gemini-2.5-pro').map(r => Number(r.estimated_cost) || 0);
  const regens = rows.map(r => {
    const m = r.metadata as { regen_attempts?: number } | null;
    return Number(m?.regen_attempts) || 0;
  });
  const avgRegen = regens.length ? regens.reduce((a, b) => a + b, 0) / regens.length : 0;
  return {
    count: rows.length,
    proCount: proCosts.length,
    flashCount: flashCosts.length,
    pctPro: rows.length ? (proCosts.length / rows.length) * 100 : 0,
    avgRegen,
    medianCost: median(costs),
    p95Cost: percentile(costs, 95),
    flashMedian: median(flashCosts),
    proP95: percentile(proCosts, 95),
    totalGemini: costs.reduce((a, b) => a + b, 0),
    totalClaude: claudeCosts.reduce((a, b) => a + b, 0),
    medianGemini: median(costs),
    medianClaude: median(claudeCosts),
  };
}

export interface AudioStats {
  totalCost: number;
  totalCharacters: number;
  monolingualMedianPerLesson: number;
  bilingualP95PerLesson: number;
  perLessonCount: number;
}

function isNonEnglish(lang: string | null): boolean {
  if (!lang) return false;
  const l = lang.toLowerCase();
  return l !== 'english' && l !== 'en';
}

export function computeAudioStats(rows: AudioRow[]): AudioStats {
  const totalCost = rows.reduce((s, r) => s + (Number(r.estimated_cost) || 0), 0);
  const totalCharacters = rows.reduce((s, r) => s + (r.characters_used || 0), 0);

  // Group by lesson_id
  const perLesson = new Map<string, { cost: number; bilingual: boolean }>();
  for (const r of rows) {
    if (!r.lesson_id) continue;
    const prev = perLesson.get(r.lesson_id) || { cost: 0, bilingual: false };
    prev.cost += Number(r.estimated_cost) || 0;
    if (isNonEnglish(r.language)) prev.bilingual = true;
    perLesson.set(r.lesson_id, prev);
  }

  const monoCosts: number[] = [];
  const biCosts: number[] = [];
  perLesson.forEach(v => {
    if (v.bilingual) biCosts.push(v.cost);
    else monoCosts.push(v.cost);
  });

  return {
    totalCost,
    totalCharacters,
    monolingualMedianPerLesson: median(monoCosts),
    bilingualP95PerLesson: percentile(biCosts, 95),
    perLessonCount: perLesson.size,
  };
}

export function marginColorClass(pct: number): string {
  if (pct > 70) return 'text-emerald-700 dark:text-emerald-400';
  if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}
