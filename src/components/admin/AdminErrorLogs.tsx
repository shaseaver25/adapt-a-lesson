import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RefreshCw, Trash2, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string | null;
  page_url: string | null;
  user_agent: string | null;
  stack_trace: string | null;
  created_at: string;
}

export function AdminErrorLogs() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    fetchErrors();
  }, []);

  async function fetchErrors() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setErrors(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  }

  async function clearOldErrors() {
    if (!isSuperAdmin) {
      toast.error('Only super admins can clear errors');
      return;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', oneWeekAgo.toISOString());

      if (error) throw error;
      toast.success('Old errors cleared');
      fetchErrors();
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear errors');
    }
  }

  const getErrorBadgeVariant = (type: string) => {
    if (type.includes('critical') || type.includes('crash') || type.includes('fatal')) {
      return 'destructive';
    }
    if (type.includes('warning')) {
      return 'secondary';
    }
    return 'outline';
  };

  const filteredErrors = errors.filter(error =>
    error.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (error.error_message?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (error.page_url?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Error Logs</h2>
          <p className="text-muted-foreground">Monitor platform errors and issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button variant="outline" size="sm" onClick={clearOldErrors}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Errors ({filteredErrors.length})
            </CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
              <p className="text-lg font-medium">No errors logged! 🎉</p>
              <p className="text-sm">Everything is running smoothly</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <Badge variant={getErrorBadgeVariant(error.error_type)}>
                      {error.error_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(error.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {error.error_message || 'No message'}
                  </p>
                  {error.page_url && (
                    <p className="text-xs text-muted-foreground">
                      Page: {error.page_url}
                    </p>
                  )}
                  {error.stack_trace && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View stack trace
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-32">
                        {error.stack_trace}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
