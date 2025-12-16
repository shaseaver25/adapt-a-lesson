import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
  updated_at: string;
}

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(flagId: string, currentValue: boolean) {
    if (!isSuperAdmin) {
      toast.error('Only super admins can modify feature flags');
      return;
    }

    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ 
          is_enabled: !currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', flagId);

      if (error) throw error;

      setFlags(flags.map(f => 
        f.id === flagId ? { ...f, is_enabled: !currentValue } : f
      ));

      toast.success('Feature flag updated');
    } catch (error) {
      console.error('Error updating feature flag:', error);
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
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Feature Flags</h2>
        <p className="text-muted-foreground">
          Control platform features dynamically
          {!isSuperAdmin && ' (view only - super admin required to modify)'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>Toggle features on or off for the entire platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {flags.map((flag) => (
              <div 
                key={flag.id} 
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="space-y-1">
                  <Label 
                    htmlFor={flag.id} 
                    className="text-sm font-medium cursor-pointer"
                  >
                    {flag.flag_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {flag.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(flag.updated_at).toLocaleString()}
                  </p>
                </div>
                <Switch
                  id={flag.id}
                  checked={flag.is_enabled}
                  onCheckedChange={() => toggleFlag(flag.id, flag.is_enabled)}
                  disabled={!isSuperAdmin}
                />
              </div>
            ))}

            {flags.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No feature flags configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
