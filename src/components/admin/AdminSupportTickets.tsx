import { useState } from 'react';
import { Search, Eye, MessageSquare, Clock, User, Send, StickyNote, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useSupportTickets, useSupportTicket, useTicketReplies, useUpdateTicket, useCreateTicketReply } from '@/hooks/useSupportTickets';
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES, TicketStatus, TicketPriority, SupportTicket } from '@/types/helpCenter';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSupportTickets() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const { data: tickets, isLoading } = useSupportTickets({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: selectedTicket } = useSupportTicket(selectedTicketId || '');
  const { data: replies } = useTicketReplies(selectedTicketId || '');
  const updateTicket = useUpdateTicket();
  const createReply = useCreateTicketReply();

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    const updateData: Partial<SupportTicket> & { id: string } = { id: ticketId, status };
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user?.id || null;
    }
    
    await updateTicket.mutateAsync(updateData);
  };

  const handlePriorityChange = async (ticketId: string, priority: TicketPriority) => {
    await updateTicket.mutateAsync({ id: ticketId, priority });
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !user) return;

    await createReply.mutateAsync({
      ticket_id: selectedTicket.id,
      message: replyMessage,
      is_internal_note: isInternalNote,
      author_id: user.id,
      author_name: user.user_metadata?.full_name || user.email || 'Admin',
      is_admin: true,
      attachments: null,
    });

    setReplyMessage('');
    setIsInternalNote(false);
  };

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = !searchQuery ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  }) || [];

  const getStatusInfo = (status: string) => TICKET_STATUSES.find(s => s.value === status);
  const getPriorityInfo = (priority: string) => TICKET_PRIORITIES.find(p => p.value === priority);
  const getCategoryInfo = (category: string) => TICKET_CATEGORIES.find(c => c.value === category);

  // Stats
  const openCount = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressCount = tickets?.filter(t => t.status === 'in-progress').length || 0;
  const resolvedCount = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;
  const urgentCount = tickets?.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Tickets</h2>
          <p className="text-muted-foreground">Manage user support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{openCount}</div>
            <p className="text-sm text-muted-foreground">Open Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <p className="text-sm text-muted-foreground">Urgent</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {TICKET_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {TICKET_PRIORITIES.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredTickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => {
                  const statusInfo = getStatusInfo(ticket.status);
                  const priorityInfo = getPriorityInfo(ticket.priority);
                  const categoryInfo = getCategoryInfo(ticket.category);

                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{ticket.user_name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{categoryInfo?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityInfo?.color}>{priorityInfo?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No tickets found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedTicket.ticket_number}</Badge>
                  <Badge className={getStatusInfo(selectedTicket.status)?.color}>
                    {getStatusInfo(selectedTicket.status)?.label}
                  </Badge>
                  <Badge className={getPriorityInfo(selectedTicket.priority)?.color}>
                    {getPriorityInfo(selectedTicket.priority)?.label}
                  </Badge>
                </div>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  Submitted by {selectedTicket.user_name} ({selectedTicket.user_email}) on{' '}
                  {format(new Date(selectedTicket.created_at), 'MMMM d, yyyy at h:mm a')}
                </DialogDescription>
              </DialogHeader>

              <div className="grid lg:grid-cols-3 gap-6 py-4">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Original Message */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Original Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                      {selectedTicket.error_messages && (
                        <div className="mt-4 p-3 bg-muted rounded text-xs font-mono">
                          {selectedTicket.error_messages}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Conversation */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Conversation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {replies && replies.length > 0 ? (
                        replies.map(reply => (
                          <div key={reply.id} className={`flex gap-3 ${reply.is_internal_note ? 'opacity-70' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={reply.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                                {reply.is_admin ? 'A' : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{reply.author_name}</span>
                                {reply.is_admin && <Badge variant="secondary" className="text-xs">Support</Badge>}
                                {reply.is_internal_note && <Badge variant="outline" className="text-xs">Internal Note</Badge>}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <div className={`p-3 rounded text-sm ${reply.is_internal_note ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted'}`}>
                                <p className="whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No replies yet</p>
                      )}

                      <Separator />

                      {/* Reply Form */}
                      <div className="space-y-4">
                        <Tabs defaultValue="reply" onValueChange={(v) => setIsInternalNote(v === 'note')}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="reply">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Reply to User
                            </TabsTrigger>
                            <TabsTrigger value="note">
                              <StickyNote className="h-4 w-4 mr-2" />
                              Internal Note
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="reply" className="mt-4">
                            <Textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type your reply to the user..."
                              rows={4}
                            />
                          </TabsContent>
                          <TabsContent value="note" className="mt-4">
                            <Textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Add an internal note (only visible to admins)..."
                              rows={4}
                            />
                          </TabsContent>
                        </Tabs>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSendReply}
                            disabled={!replyMessage.trim() || createReply.isPending}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {createReply.isPending ? 'Sending...' : isInternalNote ? 'Add Note' : 'Send Reply'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <Select
                          value={selectedTicket.status}
                          onValueChange={(v) => handleStatusChange(selectedTicket.id, v as TicketStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TICKET_STATUSES.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Priority</p>
                        <Select
                          value={selectedTicket.priority}
                          onValueChange={(v) => handlePriorityChange(selectedTicket.id, v as TicketPriority)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TICKET_PRIORITIES.map(priority => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="text-sm">{getCategoryInfo(selectedTicket.category)?.label}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Created</p>
                        <p className="text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(selectedTicket.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {selectedTicket.page_url && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Page URL</p>
                          <p className="text-xs break-all">{selectedTicket.page_url}</p>
                        </div>
                      )}
                      {selectedTicket.browser_info && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Browser</p>
                          <p className="text-xs break-all">{selectedTicket.browser_info}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleStatusChange(selectedTicket.id, 'in-progress')}
                        disabled={selectedTicket.status === 'in-progress'}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark In Progress
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                        disabled={selectedTicket.status === 'resolved'}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                        disabled={selectedTicket.status === 'closed'}
                      >
                        Close Ticket
                      </Button>
                    </CardContent>
                  </Card>

                  {/* User Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">User Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{selectedTicket.user_name}</p>
                          <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
