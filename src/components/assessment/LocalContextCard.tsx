import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { LocalContext } from '@/types/assessmentMethods';

interface LocalContextCardProps {
  localContext: LocalContext;
  onChange: (context: LocalContext) => void;
}

export function LocalContextCard({ localContext, onChange }: LocalContextCardProps) {
  const handleChange = (field: keyof LocalContext, value: string) => {
    onChange({ ...localContext, [field]: value });
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900 shadow-emerald-100/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              Local Context
            </CardTitle>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          >
            +AI Resistance
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ground assessments in your community — impossible to outsource
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName" className="text-sm font-medium">
            School Name
          </Label>
          <Input
            id="schoolName"
            placeholder="e.g., Lincoln Elementary"
            value={localContext.schoolName}
            onChange={(e) => handleChange('schoolName', e.target.value)}
            className="bg-white/70 dark:bg-background/50 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City
            </Label>
            <Input
              id="city"
              placeholder="e.g., Minneapolis"
              value={localContext.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="bg-white/70 dark:bg-background/50 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">
              State
            </Label>
            <Input
              id="state"
              placeholder="e.g., MN"
              value={localContext.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="bg-white/70 dark:bg-background/50 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="details" className="text-sm font-medium">
            Additional Local Details
          </Label>
          <Textarea
            id="details"
            placeholder="What makes your community unique? Local landmarks, events, industries, history..."
            value={localContext.details}
            onChange={(e) => handleChange('details', e.target.value)}
            rows={3}
            className="bg-white/70 dark:bg-background/50 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500 resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
