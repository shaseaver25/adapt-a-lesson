import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, SupportTicketReply, TicketStatus } from '@/types/helpCenter';
import { useToast } from '@/hooks/use-toast';

export function useSupportTickets(options?: {
  status?: TicketStatus;
  userId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['support-tickets', options],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data as SupportTicket;
    },
    enabled: !!ticketId,
  });
}

export function useTicketReplies(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-replies', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SupportTicketReply[];
    },
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ticket: Omit<SupportTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>) => {
      // Generate ticket number
      const { data: ticketNumber } = await supabase.rpc('generate_ticket_number');
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticket,
          ticket_number: ticketNumber || `TICKET-${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({ 
        title: 'Ticket submitted successfully',
        description: `Your ticket number is ${data.ticket_number}`,
      });
    },
    onError: (error) => {
      toast({ title: 'Error creating ticket', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupportTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', data.id] });
      toast({ title: 'Ticket updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating ticket', description: error.message, variant: 'destructive' });
    },
  });
}

interface CreateTicketReplyOptions {
  reply: Omit<SupportTicketReply, 'id' | 'created_at'>;
  ticketDetails?: {
    userEmail: string;
    userName: string;
    ticketNumber: string;
    ticketSubject: string;
  };
}

export function useCreateTicketReply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reply, ticketDetails }: CreateTicketReplyOptions) => {
      const { data, error } = await supabase
        .from('support_ticket_replies')
        .insert(reply)
        .select()
        .single();

      if (error) throw error;

      // Update last reply timestamp
      const updateField = reply.is_admin ? 'last_admin_reply_at' : 'last_user_reply_at';
      await supabase
        .from('support_tickets')
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', reply.ticket_id);

      // Send email notification for admin replies (not internal notes)
      if (reply.is_admin && !reply.is_internal_note && ticketDetails) {
        try {
          await supabase.functions.invoke('send-ticket-reply-notification', {
            body: {
              userEmail: ticketDetails.userEmail,
              userName: ticketDetails.userName,
              ticketNumber: ticketDetails.ticketNumber,
              ticketSubject: ticketDetails.ticketSubject,
              replyMessage: reply.message,
              ticketId: reply.ticket_id,
            },
          });
          console.log('Email notification sent successfully');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't throw - the reply was saved successfully
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-replies', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', data.ticket_id] });
      toast({ title: 'Reply sent successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error sending reply', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}
