import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Shield, User, RefreshCw, UserPlus, Pencil, Trash2, KeyRound } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
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
  const { isSuperAdmin, userId } = useAdmin();
  
  // Add user modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('user');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Edit user modal state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Delete user state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Password reset state
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserData | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
        avatar_url: profile.avatar_url,
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

  async function updateUserRole(targetUserId: string, newRole: string) {
    if (!isSuperAdmin) {
      toast.error('Only super admins can modify roles');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    const oldRole = targetUser?.role;

    try {
      if (newRole === 'user') {
        // Remove from user_roles
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId);

        if (error) throw error;
      } else {
        // Delete existing role first, then insert new one
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId);

        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: targetUserId, 
            role: newRole as 'super_admin' | 'admin' | 'moderator' | 'user' 
          });

        if (error) throw error;
      }

      // Log the activity
      await supabase.from('activity_logs').insert({
        action_type: 'role_change',
        description: `Changed role of ${targetUser?.email || 'user'} from ${oldRole} to ${newRole}`,
        target_user_id: targetUserId,
        performed_by: userId,
        metadata: { old_role: oldRole, new_role: newRole }
      });

      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  }

  async function handleAddUser() {
    if (!isSuperAdmin) {
      toast.error('Only super admins can add users');
      return;
    }

    if (!newUserEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    if (newUserPassword && newUserPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsAddingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUserEmail.toLowerCase().trim(),
          password: newUserPassword || undefined,
          full_name: newUserName.trim() || undefined,
          role: newUserRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create user');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`User ${newUserEmail} created successfully`);
      
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('user');
      setIsAddUserOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
  }

  function openEditModal(user: UserData) {
    setEditingUser(user);
    setEditUserName(user.full_name || '');
    setEditUserEmail(user.email || '');
    setEditUserAvatar(user.avatar_url || '');
    setEditUserRole(user.role);
    setIsEditUserOpen(true);
  }

  async function handleSaveUser() {
    if (!editingUser || !isSuperAdmin) return;

    setIsSavingUser(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editUserName,
          avatar_url: editUserAvatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Log profile update
      await supabase.from('activity_logs').insert({
        action_type: 'profile_updated',
        description: `Updated profile for ${editingUser.email || editingUser.full_name}`,
        target_user_id: editingUser.id,
        performed_by: userId,
        metadata: { full_name: editUserName, avatar_url: editUserAvatar }
      });

      // Update role if changed
      if (editUserRole !== editingUser.role) {
        await updateUserRole(editingUser.id, editUserRole);
      }

      toast.success('User updated successfully');
      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSavingUser(false);
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete || !isSuperAdmin) return;

    setIsDeletingUser(true);
    try {
      // Delete user's role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);

      // Delete user's sessions
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userToDelete.id);

      // Delete user profile (this will cascade to related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      // Log the deletion
      await supabase.from('activity_logs').insert({
        action_type: 'user_deleted',
        description: `Deleted user ${userToDelete.email || userToDelete.full_name || 'unknown'}`,
        target_user_id: userToDelete.id,
        performed_by: userId,
        metadata: { deleted_email: userToDelete.email, deleted_name: userToDelete.full_name }
      });

      toast.success(`User ${userToDelete.email || userToDelete.full_name || 'deleted'} has been removed`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  }

  async function handleResetPassword() {
    if (!userToResetPassword?.email) {
      toast.error('User has no email address');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        userToResetPassword.email,
        { redirectTo: `${window.location.origin}/profile` }
      );

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        action_type: 'password_reset_sent',
        description: `Sent password reset email to ${userToResetPassword.email}`,
        target_user_id: userToResetPassword.id,
        performed_by: userId,
        metadata: { email: userToResetPassword.email }
      });

      toast.success(`Password reset email sent to ${userToResetPassword.email}`);
      setIsResetPasswordDialogOpen(false);
      setUserToResetPassword(null);
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsResettingPassword(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
          <p className="text-muted-foreground">{users.length} registered users</p>
        </div>
        
        {isSuperAdmin && (
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with email, password, and profile.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters (leave empty to send invite)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If left empty, the user will receive an invite to set their own password.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={isAddingUser}>
                  {isAddingUser ? 'Adding...' : 'Add User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user profile information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserEmail}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar">Avatar URL</Label>
              <Input
                id="edit-avatar"
                placeholder="https://example.com/avatar.jpg"
                value={editUserAvatar}
                onChange={(e) => setEditUserAvatar(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="pt-2 text-xs text-muted-foreground space-y-1">
                <p>User ID: {editingUser.id}</p>
                <p>Joined: {new Date(editingUser.created_at).toLocaleDateString()}</p>
                <p>Last Login: {editingUser.last_login_at ? new Date(editingUser.last_login_at).toLocaleDateString() : 'Never'}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSavingUser}>
              {isSavingUser ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(user)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToResetPassword(user);
                                  setIsResetPasswordDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                                title="Reset Password"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Select
                                value={user.role}
                                onValueChange={(value) => updateUserRole(user.id, value)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.email || userToDelete?.full_name}</strong>? 
              This will remove their profile, roles, and sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to <strong>{userToResetPassword?.email}</strong>. 
              The user will receive a link to create a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingPassword}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={isResettingPassword || !userToResetPassword?.email}
            >
              {isResettingPassword ? 'Sending...' : 'Send Reset Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
