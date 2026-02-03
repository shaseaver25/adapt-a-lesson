/**
 * Compliance Events Filters Component
 * 
 * Filter panel for compliance events: event type, entity type, risk level, date range.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Download } from 'lucide-react';
import type { ComplianceEventsFilters, ComplianceEventRow } from '@/hooks/compliance/useComplianceEvents';
import type { ComplianceEventType, ComplianceEntityType, PIIRisk } from '@/types/compliance';
import { toCSV, downloadCSV } from '@/lib/export/toCsv';

interface Props {
  filters: ComplianceEventsFilters;
  onFiltersChange: (filters: ComplianceEventsFilters) => void;
  onRefresh: () => void;
  isLoading: boolean;
  events?: ComplianceEventRow[];
}

const EVENT_TYPE_OPTIONS: { value: ComplianceEventType; label: string }[] = [
  { value: 'PII_WARNING_TRIGGERED', label: 'Warning Triggered' },
  { value: 'PII_OVERRIDE_USED', label: 'Override Used' },
];

const ENTITY_TYPE_OPTIONS: { value: ComplianceEntityType; label: string }[] = [
  { value: 'student_group', label: 'Student Group' },
  { value: 'lesson', label: 'Lesson' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'rubric', label: 'Rubric' },
];

const RISK_LEVEL_OPTIONS: { value: PIIRisk; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function formatDateForInput(date: Date | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

function parseDateFromInput(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

/** Truncate user_id for privacy (first 8 chars) */
function truncateUserId(userId: string | null): string {
  if (!userId) return '';
  return userId.substring(0, 8) + '...';
}

export function ComplianceEventsFilters({ filters, onFiltersChange, onRefresh, isLoading, events }: Props) {
  const handleEventTypeChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ ...filters, eventTypes: ['PII_WARNING_TRIGGERED', 'PII_OVERRIDE_USED'] });
    } else {
      onFiltersChange({ ...filters, eventTypes: [value as ComplianceEventType] });
    }
  };

  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entityType: value === 'all' ? undefined : (value as ComplianceEntityType),
    });
  };

  const handleRiskLevelChange = (value: string) => {
    onFiltersChange({
      ...filters,
      riskLevel: value === 'all' ? undefined : (value as PIIRisk),
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, startDate: parseDateFromInput(e.target.value) });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, endDate: parseDateFromInput(e.target.value) });
  };

  const handleExportCSV = () => {
    if (!events || events.length === 0) return;

    const csvContent = toCSV(events, [
      { key: 'created_at', header: 'Created At' },
      { key: 'event_type', header: 'Event Type' },
      { key: 'entity_type', header: 'Entity Type' },
      { key: 'field_name', header: 'Field Name' },
      { key: 'risk_level', header: 'Risk Level' },
      { 
        key: 'findings', 
        header: 'Findings',
        transform: (value) => Array.isArray(value) ? value.join('|') : String(value || '')
      },
      { key: 'match_count', header: 'Match Count' },
      { key: 'action_taken', header: 'Action Taken' },
      { 
        key: 'user_id', 
        header: 'User ID (Truncated)',
        transform: (value) => truncateUserId(value as string | null)
      },
    ]);

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `compliance-events-${timestamp}.csv`);
  };

  const currentEventType = filters.eventTypes?.length === 1 ? filters.eventTypes[0] : 'all';

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Event Type */}
      <div className="space-y-1.5">
        <Label htmlFor="event-type" className="text-xs">Event Type</Label>
        <Select value={currentEventType} onValueChange={handleEventTypeChange}>
          <SelectTrigger id="event-type" className="w-[160px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entity Type */}
      <div className="space-y-1.5">
        <Label htmlFor="entity-type" className="text-xs">Entity Type</Label>
        <Select value={filters.entityType || 'all'} onValueChange={handleEntityTypeChange}>
          <SelectTrigger id="entity-type" className="w-[140px]">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Risk Level */}
      <div className="space-y-1.5">
        <Label htmlFor="risk-level" className="text-xs">Risk Level</Label>
        <Select value={filters.riskLevel || 'all'} onValueChange={handleRiskLevelChange}>
          <SelectTrigger id="risk-level" className="w-[120px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {RISK_LEVEL_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Start Date */}
      <div className="space-y-1.5">
        <Label htmlFor="start-date" className="text-xs">From</Label>
        <Input
          id="start-date"
          type="date"
          value={formatDateForInput(filters.startDate)}
          onChange={handleStartDateChange}
          className="w-[140px]"
        />
      </div>

      {/* End Date */}
      <div className="space-y-1.5">
        <Label htmlFor="end-date" className="text-xs">To</Label>
        <Input
          id="end-date"
          type="date"
          value={formatDateForInput(filters.endDate)}
          onChange={handleEndDateChange}
          className="w-[140px]"
        />
      </div>

      {/* Refresh Button */}
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>

      {/* Export CSV Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportCSV} 
        disabled={isLoading || !events || events.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
