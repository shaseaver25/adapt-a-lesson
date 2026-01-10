export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: HelpArticleCategory;
  tags: string[] | null;
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  search_keywords: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type HelpArticleCategory =
  | 'getting-started'
  | 'account-settings'
  | 'courses'
  | 'events'
  | 'payments'
  | 'technical-issues'
  | 'features'
  | 'other';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  browser_info: string | null;
  page_url: string | null;
  screenshots: string[] | null;
  error_messages: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  last_user_reply_at: string | null;
  last_admin_reply_at: string | null;
}

export type TicketCategory =
  | 'bug-report'
  | 'feature-request'
  | 'account-issue'
  | 'payment-issue'
  | 'technical-problem'
  | 'content-question'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus =
  | 'open'
  | 'in-progress'
  | 'waiting-on-user'
  | 'resolved'
  | 'closed';

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  message: string;
  is_internal_note: boolean;
  author_id: string | null;
  author_name: string;
  is_admin: boolean;
  attachments: string[] | null;
  created_at: string;
}

export interface HelpArticleFeedback {
  id: string;
  article_id: string;
  user_id: string | null;
  is_helpful: boolean;
  feedback_comment: string | null;
  created_at: string;
}

export const HELP_CATEGORIES: { value: HelpArticleCategory; label: string; icon: string }[] = [
  { value: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { value: 'account-settings', label: 'Account Settings', icon: '⚙️' },
  { value: 'courses', label: 'Courses', icon: '📚' },
  { value: 'events', label: 'Events', icon: '📅' },
  { value: 'payments', label: 'Payments', icon: '💳' },
  { value: 'technical-issues', label: 'Technical Issues', icon: '🔧' },
  { value: 'features', label: 'Features', icon: '✨' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'account-issue', label: 'Account Issue' },
  { value: 'payment-issue', label: 'Payment Issue' },
  { value: 'technical-problem', label: 'Technical Problem' },
  { value: 'content-question', label: 'Content Question' },
  { value: 'other', label: 'Other' },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'bg-green-100 text-green-800' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'waiting-on-user', label: 'Waiting on User', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-purple-100 text-purple-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
];
