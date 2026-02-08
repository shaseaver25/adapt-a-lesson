import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface InviteColleagueModalProps {
  trigger?: React.ReactNode;
}

export function InviteColleagueModal({ trigger }: InviteColleagueModalProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviterName, setInviterName] = useState('A colleague');

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (data?.full_name) {
        setInviterName(data.full_name);
      } else if (user.email) {
        setInviterName(user.email.split('@')[0]);
      }
    }
    
    fetchProfile();
  }, [user]);

  async function handleSendInvite() {
    if (!recipientEmail.trim()) {
      toast.error('Please enter your colleague\'s email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to send invitations');
        return;
      }

      const response = await supabase.functions.invoke('send-invite-educator-email', {
        body: {
          recipientEmail: recipientEmail.trim().toLowerCase(),
          inviterName,
          personalMessage: personalMessage.trim() || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send invitation');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Invitation sent successfully!', {
        description: `${recipientEmail} will receive your invitation shortly.`,
      });

      setRecipientEmail('');
      setPersonalMessage('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite a Colleague
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite a Fellow Educator
          </DialogTitle>
          <DialogDescription>
            Share RealPath Learning with a colleague. They'll receive an email invitation to try the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="colleague-email">Colleague's Email</Label>
            <Input
              id="colleague-email"
              type="email"
              placeholder="colleague@school.edu"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personal-message">Personal Message (Optional)</Label>
            <Textarea
              id="personal-message"
              placeholder="Add a personal note to your invitation..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be included in the invitation email.
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              The invitation will be sent from <strong>RealPath Learning</strong> on your behalf, 
              mentioning that <strong>{inviterName}</strong> thinks they'll love it.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite} disabled={isSending} className="gap-2">
            <Send className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
