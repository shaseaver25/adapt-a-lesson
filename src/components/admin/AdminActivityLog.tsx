import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Search, 
  UserPlus, 
  UserMinus, 
  Shield, 
  LogIn, 
  Edit, 
  Activity,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action_type: string;
  description: string;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  performed_by: string | null;
  created_at: string;
  performer_email?: string;
  target_email?: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failure_reason: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

type CombinedActivity = {
  id: string;
  type: 'activity' | 'login';
  action_type: string;
  description: string;
  email?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
};

export function AdminActivityLog() {
  const [activities, setActivities] = useState<CombinedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    setLoading(true);
    try {
      // Fetch activity logs
      const { data: activityLogs, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (activityError) throw activityError;

      // Fetch login attempts
      const { data: loginAttempts, error: loginError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Get performer emails for activity logs
      const performerIds = [...new Set((activityLogs || []).map(a => a.performed_by).filter(Boolean))];
      const targetIds = [...new Set((activityLogs || []).map(a => a.target_user_id).filter(Boolean))];
      const allIds = [...new Set([...performerIds, ...targetIds])];

      let emailMap: Record<string, string> = {};
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', allIds);
        
        profiles?.forEach(p => {
          if (p.email) emailMap[p.id] = p.email;
        });
      }

      // Combine and format activities
      const formattedActivityLogs: CombinedActivity[] = (activityLogs || []).map(log => ({
        id: log.id,
        type: 'activity' as const,
        action_type: log.action_type,
        description: log.description,
        email: log.performed_by ? emailMap[log.performed_by] : undefined,
        created_at: log.created_at,
        metadata: log.metadata as Record<string, unknown>,
      }));

      const formattedLoginAttempts: CombinedActivity[] = (loginAttempts || []).map(attempt => ({
        id: attempt.id,
        type: 'login' as const,
        action_type: attempt.success ? 'login_success' : 'login_failed',
        description: attempt.success 
          ? `Successful login from ${attempt.ip_address || 'unknown IP'}`
          : `Failed login: ${attempt.failure_reason || 'Invalid credentials'}`,
        email: attempt.email,
        created_at: attempt.created_at,
        success: attempt.success,
        metadata: {
          ip_address: attempt.ip_address,
          user_agent: attempt.user_agent,
        },
      }));

      // Combine and sort by date
      const combined = [...formattedActivityLogs, ...formattedLoginAttempts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);

      setActivities(combined);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login_success':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'login_failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'role_change':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'user_created':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'user_deleted':
        return <UserMinus className="h-4 w-4 text-destructive" />;
      case 'profile_updated':
        return <Edit className="h-4 w-4 text-amber-500" />;
      case 'password_reset_sent':
        return <KeyRound className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (actionType: string, success?: boolean) => {
    switch (actionType) {
      case 'login_success':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Login</Badge>;
      case 'login_failed':
        return <Badge variant="destructive">Failed Login</Badge>;
      case 'role_change':
        return <Badge variant="default">Role Change</Badge>;
      case 'user_created':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">User Created</Badge>;
      case 'user_deleted':
        return <Badge variant="destructive">User Deleted</Badge>;
      case 'profile_updated':
        return <Badge variant="secondary">Profile Updated</Badge>;
      case 'password_reset_sent':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Password Reset</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      (activity.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'logins' && activity.type === 'login') ||
      (filterType === 'role_changes' && activity.action_type === 'role_change') ||
      (filterType === 'user_changes' && ['user_created', 'user_deleted', 'profile_updated'].includes(activity.action_type));
    
    return matchesSearch && matchesFilter;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Activity Log</h2>
          <p className="text-muted-foreground">Recent user actions and login attempts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="logins">Login Attempts</SelectItem>
                <SelectItem value="role_changes">Role Changes</SelectItem>
                <SelectItem value="user_changes">User Changes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || filterType !== 'all' ? 'No activities match your filters' : 'No activity recorded yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-1">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(activity.action_type, activity.success)}
                      {activity.email && (
                        <span className="text-sm font-medium truncate">{activity.email}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
