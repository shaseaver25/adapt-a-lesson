import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateTicket } from '@/hooks/useSupportTickets';
import { useAuth } from '@/hooks/useAuth';
import { TICKET_CATEGORIES, TicketCategory, TicketPriority } from '@/types/helpCenter';

export default function SubmitTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createTicket = useCreateTicket();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '' as TicketCategory | '',
    priority: 'medium' as TicketPriority,
    error_messages: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (!formData.subject || !formData.description || !formData.category) {
      return;
    }

    try {
      const result = await createTicket.mutateAsync({
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || user.email || 'User',
        subject: formData.subject,
        description: formData.description,
        category: formData.category as TicketCategory,
        priority: formData.priority,
        error_messages: formData.error_messages || null,
        browser_info: navigator.userAgent,
        page_url: document.referrer || null,
        status: 'open',
        assigned_to: null,
        screenshots: null,
        resolution_notes: null,
        resolved_at: null,
        resolved_by: null,
        last_user_reply_at: null,
        last_admin_reply_at: null,
      });

      setTicketNumber(result.ticket_number);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-4">Login Required</p>
              <p className="text-muted-foreground mb-6">
                Please log in to submit a support ticket.
              </p>
              <Button onClick={() => navigate('/login')}>Log In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">Ticket Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your ticket number is <strong className="text-foreground">{ticketNumber}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                We'll review your request and respond as soon as possible. You can track the status of your ticket in your support dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/help/tickets')}>View My Tickets</Button>
                <Button variant="outline" onClick={() => navigate('/help')}>Back to Help Center</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/help')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Center
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Issue Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as TicketCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of your issue"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please describe your issue in detail. Include steps to reproduce if applicable."
                    rows={6}
                    required
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question or minor issue</SelectItem>
                      <SelectItem value="medium">Medium - Affecting my work but have a workaround</SelectItem>
                      <SelectItem value="high">High - Blocking my work, need help soon</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical issue, system down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Messages */}
                <div className="space-y-2">
                  <Label htmlFor="error_messages">Error Messages (if any)</Label>
                  <Textarea
                    id="error_messages"
                    value={formData.error_messages}
                    onChange={(e) => setFormData({ ...formData, error_messages: e.target.value })}
                    placeholder="Copy and paste any error messages you're seeing"
                    rows={3}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your browser information will be automatically included to help us troubleshoot.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createTicket.isPending || !formData.subject || !formData.description || !formData.category}
                >
                  {createTicket.isPending ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
