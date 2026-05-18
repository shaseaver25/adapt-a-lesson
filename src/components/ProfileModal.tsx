import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock, Loader2, CreditCard, Sparkles, Clock, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING_TIERS } from '@/lib/pricing';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; email?: string } | null;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Subscription state
  const { 
    isSubscribed, 
    tier, 
    subscriptionEnd, 
    isTrialing, 
    trialEnd, 
    daysRemaining,
    loading: subscriptionLoading,
    openCustomerPortal,
  } = useSubscription();
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  async function fetchProfile() {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleManageSubscription() {
    setOpeningPortal(true);
    try {
      await openCustomerPortal();
    } catch (error: any) {
      console.error('Error opening portal:', error);
      toast.error(error.message || 'Failed to open subscription management');
    } finally {
      setOpeningPortal(false);
    }
  }

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPlanName = () => {
    if (!isSubscribed) return 'No Active Plan';
    return PRICING_TIERS.individual.name;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Profile
          </DialogTitle>
          <DialogDescription>
            Update your profile information and manage your subscription.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Subscription Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Subscription</h3>
              </div>

              {subscriptionLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking subscription...
                </div>
              ) : isSubscribed ? (
                <div className="space-y-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-success" />
                      <span className="font-medium">{getPlanName()}</span>
                    </div>
                    {isTrialing && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Trial
                      </Badge>
                    )}
                  </div>
                  
                  {isTrialing && trialEnd ? (
                    <p className="text-sm text-muted-foreground">
                      Trial ends: {formatDate(trialEnd)}
                      {daysRemaining !== null && (
                        <span className="ml-1">({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)</span>
                      )}
                    </p>
                  ) : subscriptionEnd ? (
                    <p className="text-sm text-muted-foreground">
                      {tier === 'monthly' ? 'Renews' : 'Expires'}: {formatDate(subscriptionEnd)}
                    </p>
                  ) : null}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                    className="w-full"
                  >
                    {openingPortal ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    No active subscription
                  </p>
                  <Link to="/pricing" onClick={onClose}>
                    <Button size="sm" className="w-full">
                      <Sparkles className="h-4 w-4 mr-2" />
                      View Plans
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <Separator />

            {/* Profile Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>

            <Separator />

            {/* Password Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Change Password</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {newPassword && !passwordValid && (
                  <p className="text-xs text-destructive">Password must be at least 8 characters</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={changingPassword || !passwordValid || !passwordsMatch || !newPassword}
                variant="outline"
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
