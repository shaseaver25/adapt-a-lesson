import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, ChevronUp, Download, Filter, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface UserFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  minLogins: number | undefined;
  maxLogins: number | undefined;
  minTimeHours: number | undefined;
  maxTimeHours: number | undefined;
}

interface UserExportFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onExport: () => void;
  isExporting: boolean;
  activeFilterCount: number;
}

export function UserExportFilters({
  filters,
  onFiltersChange,
  onExport,
  isExporting,
  activeFilterCount
}: UserExportFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateFrom: undefined,
      dateTo: undefined,
      minLogins: undefined,
      maxLogins: undefined,
      minTimeHours: undefined,
      maxTimeHours: undefined
    });
  };

  const quickDatePresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2 mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <Button 
          onClick={onExport} 
          disabled={isExporting}
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Download CSV'}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <CollapsibleContent>
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Registration Date</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => updateFilter('dateFrom', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => updateFilter('dateTo', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {quickDatePresets.map(preset => (
                    <Button
                      key={preset.days}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => applyDatePreset(preset.days)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Login Count Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Login Count</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      min={0}
                      value={filters.minLogins ?? ''}
                      onChange={(e) => updateFilter('minLogins', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="h-9"
                    />
                  </div>
                  <span className="flex items-center text-muted-foreground">-</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Max"
                      min={0}
                      value={filters.maxLogins ?? ''}
                      onChange={(e) => updateFilter('maxLogins', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Time on Platform Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Time on Platform (hours)</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      min={0}
                      step={0.5}
                      value={filters.minTimeHours ?? ''}
                      onChange={(e) => updateFilter('minTimeHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-9"
                    />
                  </div>
                  <span className="flex items-center text-muted-foreground">-</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Max"
                      min={0}
                      step={0.5}
                      value={filters.maxTimeHours ?? ''}
                      onChange={(e) => updateFilter('maxTimeHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
