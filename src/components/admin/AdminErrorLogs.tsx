import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AdminErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => 
    log.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.page_url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getErrorBadgeVariant = (type: string) => {
    if (type.includes('critical') || type.includes('fatal')) return 'destructive';
    if (type.includes('warning')) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Error Logs</h2>
        <p className="text-muted-foreground">Monitor platform errors and issues</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Last 100 logged errors</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={getErrorBadgeVariant(log.error_type)}>
                          {log.error_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.error_message || ''}>
                        {log.error_message || 'No message'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground" title={log.page_url || ''}>
                        {log.page_url || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
              <p>{searchTerm ? 'No errors match your search' : 'No errors logged yet'}</p>
              <p className="text-sm">This is a good thing!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
