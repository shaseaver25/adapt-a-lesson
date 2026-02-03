/**
 * Compliance Events Table Component
 * 
 * Displays compliance events in a table with pagination.
 * Never displays actual PII text - only metadata.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComplianceEventRow } from '@/hooks/compliance/useComplianceEvents';

interface Props {
  events: ComplianceEventRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRiskBadgeVariant(risk: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (risk) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    default:
      return 'secondary';
  }
}

function getEventTypeBadge(eventType: string) {
  if (eventType === 'PII_OVERRIDE_USED') {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
        Override
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
      Warning
    </Badge>
  );
}

function getActionBadge(action: string | null) {
  if (!action) return <span className="text-muted-foreground">-</span>;
  
  switch (action) {
    case 'blocked':
      return <Badge variant="secondary">Blocked</Badge>;
    case 'edited':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Edited</Badge>;
    case 'override_allowed':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Override</Badge>;
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
}

function formatFindings(findings: string[]): React.ReactNode {
  if (!findings || findings.length === 0) return '-';
  
  return (
    <div className="flex flex-wrap gap-1">
      {findings.map((finding, idx) => (
        <Badge key={idx} variant="outline" className="text-xs">
          {finding.replace(/_/g, ' ')}
        </Badge>
      ))}
    </div>
  );
}

export function ComplianceEventsTable({
  events,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="w-[90px]">Event</TableHead>
              <TableHead className="w-[100px]">Entity</TableHead>
              <TableHead className="w-[120px]">Field</TableHead>
              <TableHead className="w-[80px]">Risk</TableHead>
              <TableHead className="min-w-[150px]">Findings</TableHead>
              <TableHead className="w-[60px] text-center">Count</TableHead>
              <TableHead className="w-[90px]">Action</TableHead>
              <TableHead className="w-[180px]">User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(event.created_at)}
                </TableCell>
                <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                <TableCell className="capitalize text-sm">
                  {event.entity_type.replace(/_/g, ' ')}
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {event.field_name}
                </TableCell>
                <TableCell>
                  <Badge variant={getRiskBadgeVariant(event.risk_level)} className="capitalize">
                    {event.risk_level}
                  </Badge>
                </TableCell>
                <TableCell>{formatFindings(event.findings)}</TableCell>
                <TableCell className="text-center text-sm">
                  {event.match_count}
                </TableCell>
                <TableCell>{getActionBadge(event.action_taken)}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {event.user_email || event.user_id?.slice(0, 8) || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalCount} events
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
