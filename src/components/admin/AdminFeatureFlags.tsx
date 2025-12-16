import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';
import { ToggleLeft, Sparkles, Volume2, Download, Languages, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
  updated_at: string;
}

const flagIcons: Record<string, React.ReactNode> = {
  audio_generation: <Volume2 className="h-5 w-5" />,
  image_generation: <Sparkles className="h-5 w-5" />,
  html_export: <Download className="h-5 w-5" />,
  bilingual_mode: <Languages className="h-5 w-5" />,
  advanced_analytics: <BarChart3 className="h-5 w-5" />,
};

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(flag: FeatureFlag) {
    if (!isSuperAdmin) {
      toast.error('Only super admins can modify feature flags');
      return;
    }

    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ 
          is_enabled: !flag.is_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(flags.map(f => 
        f.id === flag.id ? { ...f, is_enabled: !flag.is_enabled } : f
      ));

      toast.success(`${flag.flag_name.replace(/_/g, ' ')} ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating flag:', error);
      toast.error('Failed to update feature flag');
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Feature Flags</h2>
          <p className="text-muted-foreground">
            Enable or disable features across the platform
            {!isSuperAdmin && ' (view only)'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFlags} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            Platform Features
          </CardTitle>
          <CardDescription>
            Toggle features on or off for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No feature flags configured
              </p>
            ) : (
              flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {flagIcons[flag.flag_name] || <ToggleLeft className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {flag.flag_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                          {flag.is_enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {flag.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => toggleFlag(flag)}
                    disabled={!isSuperAdmin}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
