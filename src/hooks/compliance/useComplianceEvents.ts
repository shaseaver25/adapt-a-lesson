/**
 * Compliance Events Hook
 * 
 * Fetches compliance events for admin review with filtering and pagination.
 * Uses React Query for caching and state management.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorUtils';
import type { PIIRisk, PIIFindingType, ComplianceEventType, ComplianceEntityType } from '@/types/compliance';

/** Filter options for compliance events query */
export interface ComplianceEventsFilters {
  eventTypes?: ComplianceEventType[];
  entityType?: ComplianceEntityType;
  riskLevel?: PIIRisk;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

/** Pagination options */
export interface ComplianceEventsPagination {
  limit: number;
  offset: number;
}

/** Single compliance event row - no PII fields */
export interface ComplianceEventRow {
  id: string;
  user_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  field_name: string;
  risk_level: string;
  findings: string[];
  match_count: number;
  action_taken: string | null;
  created_at: string;
}

/** Query result with pagination metadata */
export interface ComplianceEventsResult {
  events: ComplianceEventRow[];
  totalCount: number;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 25;

/** Default filters: last 30 days, all event types */
export function getDefaultFilters(): ComplianceEventsFilters {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    eventTypes: ['PII_WARNING_TRIGGERED', 'PII_OVERRIDE_USED'],
    startDate,
    endDate,
  };
}

/**
 * Fetch compliance events with filters and pagination.
 */
async function fetchComplianceEvents(
  filters: ComplianceEventsFilters,
  pagination: ComplianceEventsPagination
): Promise<ComplianceEventsResult> {
  let query = supabase
    .from('compliance_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  // Apply event type filter
  if (filters.eventTypes && filters.eventTypes.length > 0) {
    query = query.in('event_type', filters.eventTypes);
  }

  // Apply entity type filter
  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  // Apply risk level filter
  if (filters.riskLevel) {
    query = query.eq('risk_level', filters.riskLevel);
  }

  // Apply date range filter
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }
  if (filters.endDate) {
    // Set end of day for end date
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endOfDay.toISOString());
  }

  // Apply user ID filter
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(handleError(error, 'Fetch Compliance Events'));
  }

  // Return events directly - no PII enrichment
  const events: ComplianceEventRow[] = (data || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    event_type: row.event_type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    field_name: row.field_name,
    risk_level: row.risk_level,
    findings: row.findings,
    match_count: row.match_count,
    action_taken: row.action_taken,
    created_at: row.created_at,
  }));

  return {
    events,
    totalCount: count || 0,
    hasMore: (count || 0) > pagination.offset + pagination.limit,
  };
}

/**
 * Hook for fetching compliance events with React Query.
 */
export function useComplianceEvents(
  filters: ComplianceEventsFilters = getDefaultFilters(),
  pagination: ComplianceEventsPagination = { limit: DEFAULT_LIMIT, offset: 0 }
) {
  return useQuery({
    queryKey: ['compliance-events', filters, pagination],
    queryFn: () => fetchComplianceEvents(filters, pagination),
    staleTime: 30000, // 30 seconds
  });
}
