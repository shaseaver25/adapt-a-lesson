import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AudioUsageStats {
  usedThisMonth: number;
  remainingBudget: number;
  percentUsed: number;
  lessonsWithAudio: number;
  totalCharacters: number;
  byLanguage: { language: string; characterCount: number; cost: number }[];
  bySection: { sectionType: string; characterCount: number; cost: number }[];
  recentUsage: { date: string; cost: number; characters: number }[];
}

// Cost optimization settings
export const AUDIO_BUDGET = {
  monthlyBudgetUSD: 50,
  costPer10kChars: 0.30, // ElevenLabs multilingual_v2 pricing
  maxCharactersPerSection: {
    'learning-target': 500,
    'instructions': 1000,
    'vocabulary': 200,
    'content': 3000,
    'reflection-prompt': 300,
  } as Record<string, number>,
};

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getLast30Days(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

export function useAudioUsage() {
  const [stats, setStats] = useState<AudioUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  async function fetchUsageStats() {
    setLoading(true);
    setError(null);

    try {
      const startOfMonth = getStartOfMonth();
      const last30Days = getLast30Days();

      // Get all usage this month
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('audio_usage')
        .select('*')
        .gte('created_at', startOfMonth);

      if (monthlyError) throw monthlyError;

      // Calculate totals
      const usedThisMonth = monthlyData?.reduce((sum, row) => sum + (row.estimated_cost || 0), 0) || 0;
      const totalCharacters = monthlyData?.reduce((sum, row) => sum + (row.characters_used || 0), 0) || 0;
      const remainingBudget = Math.max(0, AUDIO_BUDGET.monthlyBudgetUSD - usedThisMonth);
      const percentUsed = Math.min(100, (usedThisMonth / AUDIO_BUDGET.monthlyBudgetUSD) * 100);

      // Count unique lessons with audio
      const uniqueLessons = new Set(monthlyData?.map(row => row.lesson_id).filter(Boolean));
      const lessonsWithAudio = uniqueLessons.size;

      // Group by language
      const languageMap = new Map<string, { characterCount: number; cost: number }>();
      monthlyData?.forEach(row => {
        const lang = row.language || 'English';
        const existing = languageMap.get(lang) || { characterCount: 0, cost: 0 };
        languageMap.set(lang, {
          characterCount: existing.characterCount + (row.characters_used || 0),
          cost: existing.cost + (row.estimated_cost || 0),
        });
      });
      const byLanguage = Array.from(languageMap.entries())
        .map(([language, data]) => ({ language, ...data }))
        .sort((a, b) => b.characterCount - a.characterCount);

      // Group by section type
      const sectionMap = new Map<string, { characterCount: number; cost: number }>();
      monthlyData?.forEach(row => {
        const section = row.section_type || 'unknown';
        const existing = sectionMap.get(section) || { characterCount: 0, cost: 0 };
        sectionMap.set(section, {
          characterCount: existing.characterCount + (row.characters_used || 0),
          cost: existing.cost + (row.estimated_cost || 0),
        });
      });
      const bySection = Array.from(sectionMap.entries())
        .map(([sectionType, data]) => ({ sectionType, ...data }))
        .sort((a, b) => b.characterCount - a.characterCount);

      // Recent usage (last 7 days grouped by day)
      const recentMap = new Map<string, { cost: number; characters: number }>();
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      monthlyData
        ?.filter(row => new Date(row.created_at) >= last7Days)
        .forEach(row => {
          const date = new Date(row.created_at).toLocaleDateString();
          const existing = recentMap.get(date) || { cost: 0, characters: 0 };
          recentMap.set(date, {
            cost: existing.cost + (row.estimated_cost || 0),
            characters: existing.characters + (row.characters_used || 0),
          });
        });
      const recentUsage = Array.from(recentMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setStats({
        usedThisMonth,
        remainingBudget,
        percentUsed,
        lessonsWithAudio,
        totalCharacters,
        byLanguage,
        bySection,
        recentUsage,
      });
    } catch (err) {
      console.error('Error fetching audio usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, error, refresh: fetchUsageStats };
}

/**
 * Check if audio generation is within budget
 */
export async function checkAudioBudget(): Promise<{
  remainingBudget: number;
  canGenerate: boolean;
  usageThisMonth: number;
  percentUsed: number;
}> {
  const startOfMonth = getStartOfMonth();

  const { data, error } = await supabase
    .from('audio_usage')
    .select('estimated_cost')
    .gte('created_at', startOfMonth);

  if (error) {
    console.error('Error checking budget:', error);
    return {
      remainingBudget: AUDIO_BUDGET.monthlyBudgetUSD,
      canGenerate: true,
      usageThisMonth: 0,
      percentUsed: 0,
    };
  }

  const usageThisMonth = data?.reduce((sum, row) => sum + (row.estimated_cost || 0), 0) || 0;
  const remainingBudget = Math.max(0, AUDIO_BUDGET.monthlyBudgetUSD - usageThisMonth);
  const percentUsed = Math.min(100, (usageThisMonth / AUDIO_BUDGET.monthlyBudgetUSD) * 100);

  return {
    remainingBudget,
    canGenerate: remainingBudget > 0.01, // Allow generation if at least 1 cent remaining
    usageThisMonth,
    percentUsed,
  };
}

/**
 * Estimate cost for generating audio
 */
export function estimateAudioCost(characterCount: number): number {
  return characterCount * 0.00003; // $0.30 per 10K characters
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
