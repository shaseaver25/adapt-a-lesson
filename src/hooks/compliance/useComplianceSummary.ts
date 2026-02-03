/**
 * Compliance Summary Hook
 * 
 * Fetches aggregated compliance statistics for admin dashboard.
 * Uses React Query for caching and state management.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorUtils';

/** Field count for top fields display */
interface FieldCount {
  field: string;
  count: number;
}

/** Finding type count for top findings display */
interface FindingCount {
  finding: string;
  count: number;
}

/** Compliance summary data */
export interface ComplianceSummaryData {
  totalEvents: number;
  warningsCount: number;
  overridesCount: number;
  highRiskCount: number;
  topFields: FieldCount[];
  topFindings: FindingCount[];
}

/**
 * Fetch compliance summary for the last 30 days.
 */
async function fetchComplianceSummary(): Promise<ComplianceSummaryData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('compliance_events')
    .select('event_type, risk_level, field_name, findings')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    throw new Error(handleError(error, 'Fetch Compliance Summary'));
  }

  const events = data || [];
  
  // Calculate counts
  const totalEvents = events.length;
  const warningsCount = events.filter(e => e.event_type === 'PII_WARNING_TRIGGERED').length;
  const overridesCount = events.filter(e => e.event_type === 'PII_OVERRIDE_USED').length;
  const highRiskCount = events.filter(e => e.risk_level === 'high').length;

  // Count field occurrences
  const fieldCounts: Record<string, number> = {};
  events.forEach(e => {
    const field = e.field_name || 'unknown';
    fieldCounts[field] = (fieldCounts[field] || 0) + 1;
  });

  const topFields: FieldCount[] = Object.entries(fieldCounts)
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Count finding type occurrences (flatten findings arrays)
  const findingCounts: Record<string, number> = {};
  events.forEach(e => {
    const findings = e.findings || [];
    findings.forEach((finding: string) => {
      findingCounts[finding] = (findingCounts[finding] || 0) + 1;
    });
  });

  const topFindings: FindingCount[] = Object.entries(findingCounts)
    .map(([finding, count]) => ({ finding, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    totalEvents,
    warningsCount,
    overridesCount,
    highRiskCount,
    topFields,
    topFindings,
  };
}

/**
 * Hook for fetching compliance summary with React Query.
 */
export function useComplianceSummary() {
  return useQuery({
    queryKey: ['compliance-summary'],
    queryFn: fetchComplianceSummary,
    staleTime: 60000, // 1 minute
  });
}
