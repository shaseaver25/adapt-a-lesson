import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Volume2, 
  TrendingUp, 
  DollarSign, 
  FileAudio, 
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAudioUsage, AUDIO_BUDGET, formatCurrency } from '@/hooks/useAudioUsage';
import { cn } from '@/lib/utils';

interface AudioUsageDashboardProps {
  compact?: boolean;
}

export function AudioUsageDashboard({ compact = false }: AudioUsageDashboardProps) {
  const { stats, loading, error, refresh } = useAudioUsage();

  if (loading) {
    return (
      <Card className="audio-usage-dashboard">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Generation Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="audio-usage-dashboard border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const isOverBudget = stats.percentUsed >= 100;
  const isNearBudget = stats.percentUsed >= 80;

  if (compact) {
    return (
      <Card className="audio-usage-dashboard">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-accent" />
              Audio Budget
            </span>
            <Badge 
              variant={isOverBudget ? "destructive" : isNearBudget ? "secondary" : "outline"}
              className="text-xs"
            >
              {stats.percentUsed.toFixed(0)}% used
            </Badge>
          </div>
          <Progress 
            value={stats.percentUsed} 
            className={cn(
              "h-2",
              isOverBudget && "[&>div]:bg-destructive",
              isNearBudget && !isOverBudget && "[&>div]:bg-amber-500"
            )}
          />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{formatCurrency(stats.usedThisMonth)} used</span>
            <span>{formatCurrency(stats.remainingBudget)} left</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="audio-usage-dashboard">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-accent" />
              Audio Generation Usage
            </CardTitle>
            <CardDescription>
              ElevenLabs TTS usage for differentiated lessons
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Monthly Budget</span>
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Over Budget
                </Badge>
              ) : isNearBudget ? (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  Near Limit
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                  <CheckCircle className="h-3 w-3" />
                  On Track
                </Badge>
              )}
            </div>
          </div>
          <Progress 
            value={stats.percentUsed} 
            className={cn(
              "h-3",
              isOverBudget && "[&>div]:bg-destructive",
              isNearBudget && !isOverBudget && "[&>div]:bg-amber-500"
            )}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(stats.usedThisMonth)} of {formatCurrency(AUDIO_BUDGET.monthlyBudgetUSD)}
            </span>
            <span className="font-medium">
              {formatCurrency(stats.remainingBudget)} remaining
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            value={formatCurrency(stats.usedThisMonth)}
            label="Spent this month"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            value={stats.totalCharacters.toLocaleString()}
            label="Characters generated"
          />
          <StatCard
            icon={<FileAudio className="h-4 w-4" />}
            value={stats.lessonsWithAudio.toString()}
            label="Lessons with audio"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            value={stats.byLanguage.length.toString()}
            label="Languages used"
          />
        </div>

        {/* Usage by Language */}
        {stats.byLanguage.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Usage by Language</h4>
            <div className="space-y-2">
              {stats.byLanguage.slice(0, 5).map(lang => (
                <div key={lang.language} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{lang.language}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {lang.characterCount.toLocaleString()} chars
                    </span>
                    <span className="font-medium w-16 text-right">
                      {formatCurrency(lang.cost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage by Section Type */}
        {stats.bySection.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Usage by Section Type</h4>
            <div className="space-y-2">
              {stats.bySection.map(section => (
                <div key={section.sectionType} className="flex items-center justify-between text-sm">
                  <span className="text-foreground capitalize">
                    {section.sectionType.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {section.characterCount.toLocaleString()} chars
                    </span>
                    <span className="font-medium w-16 text-right">
                      {formatCurrency(section.cost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats.recentUsage.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Recent Activity (Last 7 Days)</h4>
            <div className="flex gap-1 h-16">
              {stats.recentUsage.map((day, index) => {
                const maxCost = Math.max(...stats.recentUsage.map(d => d.cost));
                const height = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
                return (
                  <div 
                    key={day.date} 
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                    title={`${day.date}: ${formatCurrency(day.cost)}`}
                  >
                    <div 
                      className="w-full bg-accent/60 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cost Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Audio generated using ElevenLabs Multilingual v2 at ~$0.30 per 10,000 characters.
            Budget resets monthly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card/50">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default AudioUsageDashboard;
