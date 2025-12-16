import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Shield, User, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_login_at: string | null;
  login_count: number | null;
  lesson_count: number;
  group_count: number;
  role: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get lesson counts per user
      const { data: lessons } = await supabase
        .from('generated_lessons')
        .select('user_id');

      const lessonCounts: Record<string, number> = {};
      lessons?.forEach(row => {
        if (row.user_id) {
          lessonCounts[row.user_id] = (lessonCounts[row.user_id] || 0) + 1;
        }
      });

      // Get group counts per user
      const { data: groups } = await supabase
        .from('student_groups')
        .select('user_id');

      const groupCounts: Record<string, number> = {};
      groups?.forEach(row => {
        if (row.user_id) {
          groupCounts[row.user_id] = (groupCounts[row.user_id] || 0) + 1;
        }
      });

      // Map profiles with roles and counts
      const usersWithData = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        login_count: profile.login_count,
        lesson_count: lessonCounts[profile.id] || 0,
        group_count: groupCounts[profile.id] || 0,
        role: roles?.find(r => r.user_id === profile.id)?.role || 'user',
      }));

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    if (!isSuperAdmin) {
      toast.error('Only super admins can modify roles');
      return;
    }

    try {
      if (newRole === 'user') {
        // Remove from user_roles
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Delete existing role first, then insert new one
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: newRole as 'super_admin' | 'admin' | 'moderator' | 'user' 
          });

        if (error) throw error;
      }

      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  }

  const filteredUsers = users.filter(user =>
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">User Management</h2>
        <p className="text-muted-foreground">{users.length} registered users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Logins</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Joined</TableHead>
                    {isSuperAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No users match your search' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.role !== 'user' ? (
                              <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {user.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.group_count}</TableCell>
                        <TableCell>{user.lesson_count}</TableCell>
                        <TableCell>{user.login_count || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
