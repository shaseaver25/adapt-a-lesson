/**
 * Admin Compliance Events Component
 * 
 * Main component for viewing PII compliance events.
 * Displays warnings and overrides with filtering and pagination.
 * Never displays actual PII text - only metadata about detection events.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import {
  useComplianceEvents,
  getDefaultFilters,
  type ComplianceEventsFilters,
} from '@/hooks/compliance/useComplianceEvents';
import { ComplianceEventsFilters as FiltersPanel } from './compliance/ComplianceEventsFilters';
import { ComplianceEventsTable } from './compliance/ComplianceEventsTable';

const PAGE_SIZE = 25;

export function AdminComplianceEvents() {
  const [filters, setFilters] = useState<ComplianceEventsFilters>(getDefaultFilters());
  const [currentPage, setCurrentPage] = useState(0);

  const { data, isLoading, error, refetch } = useComplianceEvents(filters, {
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
  });

  const handleFiltersChange = useCallback((newFilters: ComplianceEventsFilters) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page on filter change
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Compliance Events</h2>
          <p className="text-muted-foreground">
            PII detection warnings and admin overrides for FERPA compliance monitoring
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Event Log
          </CardTitle>
          <FiltersPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            events={data?.events}
          />
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">Failed to load compliance events</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && data?.events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No compliance events found for the selected filters.</p>
              <p className="text-sm mt-1">
                Try adjusting your date range or filter criteria.
              </p>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && data && data.events.length > 0 && (
            <ComplianceEventsTable
              events={data.events}
              totalCount={data.totalCount}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
