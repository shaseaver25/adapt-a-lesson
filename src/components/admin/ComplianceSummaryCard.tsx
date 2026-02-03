import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileWarning, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useComplianceSummary } from '@/hooks/compliance/useComplianceSummary';

/** Format finding type for display */
function formatFinding(finding: string): string {
  return finding
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Format field name for display */
function formatField(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function ComplianceSummaryCard() {
  const { data, isLoading, error } = useComplianceSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Compliance Summary (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Compliance Summary (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load compliance data</p>
        </CardContent>
      </Card>
    );
  }

  const { totalEvents, warningsCount, overridesCount, highRiskCount, topFields, topFindings } = data || {
    totalEvents: 0,
    warningsCount: 0,
    overridesCount: 0,
    highRiskCount: 0,
    topFields: [],
    topFindings: [],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Compliance Summary (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <FileWarning className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{totalEvents}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-lg font-semibold">{warningsCount}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-lg font-semibold">{overridesCount}</p>
              <p className="text-xs text-muted-foreground">Overrides</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-lg font-semibold">{highRiskCount}</p>
              <p className="text-xs text-muted-foreground">High Risk</p>
            </div>
          </div>
        </div>

        {/* Top Fields */}
        {topFields.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Top Fields</p>
            <div className="flex flex-wrap gap-1">
              {topFields.map(({ field, count }) => (
                <Badge key={field} variant="secondary" className="text-xs">
                  {formatField(field)} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Finding Types */}
        {topFindings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Top Finding Types</p>
            <div className="flex flex-wrap gap-1">
              {topFindings.map(({ finding, count }) => (
                <Badge key={finding} variant="outline" className="text-xs">
                  {formatFinding(finding)} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {totalEvents === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No compliance events in the last 30 days
          </p>
        )}
      </CardContent>
    </Card>
  );
}
