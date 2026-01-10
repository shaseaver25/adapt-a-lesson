import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSupportTicket, useTicketReplies, useCreateTicketReply } from '@/hooks/useSupportTickets';
import { useAuth } from '@/hooks/useAuth';
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '@/types/helpCenter';
import { format } from 'date-fns';

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [replyMessage, setReplyMessage] = useState('');

  const { data: ticket, isLoading: ticketLoading } = useSupportTicket(ticketId || '');
  const { data: replies, isLoading: repliesLoading } = useTicketReplies(ticketId || '');
  const createReply = useCreateTicketReply();

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !ticket || !user) return;

    await createReply.mutateAsync({
      reply: {
        ticket_id: ticket.id,
        message: replyMessage,
        is_internal_note: false,
        author_id: user.id,
        author_name: user.user_metadata?.full_name || user.email || 'User',
        is_admin: false,
        attachments: null,
      },
    });

    setReplyMessage('');
  };

  if (ticketLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-12 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Ticket not found</p>
              <Button onClick={() => navigate('/help/tickets')}>Back to My Tickets</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = TICKET_STATUSES.find(s => s.value === ticket.status);
  const priorityInfo = TICKET_PRIORITIES.find(p => p.value === ticket.priority);
  const categoryInfo = TICKET_CATEGORIES.find(c => c.value === ticket.category);
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/help/tickets')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          My Tickets
        </Button>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Ticket Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{ticket.ticket_number}</Badge>
                      <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                      <Badge className={priorityInfo?.color}>{priorityInfo?.label}</Badge>
                    </div>
                    <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryInfo?.label} • Created {format(new Date(ticket.created_at), 'MMMM d, yyyy at h:mm a')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {ticket.error_messages && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Error Messages:</p>
                    <pre className="text-xs overflow-x-auto">{ticket.error_messages}</pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution Notes */}
            {ticket.resolution_notes && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-900">{ticket.resolution_notes}</p>
                  {ticket.resolved_at && (
                    <p className="text-sm text-green-700 mt-2">
                      Resolved on {format(new Date(ticket.resolved_at), 'MMMM d, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Conversation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {repliesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-16 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : replies && replies.length > 0 ? (
                  replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={reply.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                          {reply.is_admin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{reply.author_name}</span>
                          {reply.is_admin && (
                            <Badge variant="secondary" className="text-xs">Support</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No replies yet. We'll respond as soon as possible.
                  </p>
                )}

                {/* Reply Form */}
                {!isClosed && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim() || createReply.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {createReply.isPending ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge className={priorityInfo?.color}>{priorityInfo?.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-sm">{categoryInfo?.label}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(ticket.updated_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Need to provide more information?
                </p>
                <Button variant="outline" className="w-full" onClick={() => document.querySelector('textarea')?.focus()}>
                  Add a Reply
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
