import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HelpArticle, HelpArticleCategory } from '@/types/helpCenter';
import { useToast } from '@/hooks/use-toast';

export function useHelpArticles(options?: {
  category?: HelpArticleCategory;
  published?: boolean;
  featured?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['help-articles', options],
    queryFn: async () => {
      let query = supabase
        .from('help_articles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.published !== undefined) {
        query = query.eq('is_published', options.published);
      }

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%,search_keywords.ilike.%${options.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HelpArticle[];
    },
  });
}

export function useHelpArticle(slug: string) {
  return useQuery({
    queryKey: ['help-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('help_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data as HelpArticle;
    },
    enabled: !!slug,
  });
}

export function useCreateHelpArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (article: Partial<HelpArticle>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData = {
        title: article.title || '',
        slug: article.slug || '',
        content: article.content || '',
        excerpt: article.excerpt,
        category: article.category || 'other',
        tags: article.tags,
        is_published: article.is_published,
        search_keywords: article.search_keywords,
        display_order: article.display_order,
        is_featured: article.is_featured,
        created_by: user?.id,
        updated_by: user?.id,
      };
      
      const { data, error } = await supabase
        .from('help_articles')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      toast({ title: 'Article created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating article', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateHelpArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HelpArticle> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('help_articles')
        .update({ ...updates, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      queryClient.invalidateQueries({ queryKey: ['help-article', data.slug] });
      toast({ title: 'Article updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating article', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteHelpArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      toast({ title: 'Article deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting article', description: error.message, variant: 'destructive' });
    },
  });
}

export function useArticleFeedback(articleId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitFeedback = useMutation({
    mutationFn: async ({ isHelpful, comment }: { isHelpful: boolean; comment?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('help_article_feedback')
        .upsert({
          article_id: articleId,
          user_id: user?.id,
          is_helpful: isHelpful,
          feedback_comment: comment,
        }, {
          onConflict: 'article_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-article'] });
      toast({ title: 'Thank you for your feedback!' });
    },
    onError: (error) => {
      toast({ title: 'Error submitting feedback', description: error.message, variant: 'destructive' });
    },
  });

  return { submitFeedback };
}
