import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMyTickets } from '@/hooks/useSupportTickets';
import { useAuth } from '@/hooks/useAuth';
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '@/types/helpCenter';
import { format } from 'date-fns';

export default function MyTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tickets, isLoading } = useMyTickets();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-4">Login Required</p>
              <p className="text-muted-foreground mb-6">
                Please log in to view your support tickets.
              </p>
              <Button onClick={() => navigate('/login')}>Log In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    return TICKET_STATUSES.find(s => s.value === status) || TICKET_STATUSES[0];
  };

  const getPriorityInfo = (priority: string) => {
    return TICKET_PRIORITIES.find(p => p.value === priority) || TICKET_PRIORITIES[1];
  };

  const getCategoryInfo = (category: string) => {
    return TICKET_CATEGORIES.find(c => c.value === category);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/help')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Help Center
            </Button>
          </div>
          <Button onClick={() => navigate('/help/tickets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">My Support Tickets</h1>
          <p className="text-muted-foreground">View and manage your support requests</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/4 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const statusInfo = getStatusInfo(ticket.status);
              const priorityInfo = getPriorityInfo(ticket.priority);
              const categoryInfo = getCategoryInfo(ticket.category);

              return (
                <Card 
                  key={ticket.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/help/tickets/${ticket.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {ticket.ticket_number}
                          </Badge>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <CardDescription className="mt-1">
                          {categoryInfo?.label} • Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {ticket.last_admin_reply_at && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>Reply {format(new Date(ticket.last_admin_reply_at), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No tickets yet</p>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any support tickets yet.
              </p>
              <Button onClick={() => navigate('/help/tickets/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
