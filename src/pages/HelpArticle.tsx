import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Clock, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useHelpArticle, useArticleFeedback, useHelpArticles } from '@/hooks/useHelpArticles';
import { HELP_CATEGORIES } from '@/types/helpCenter';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Seo } from '@/components/Seo';

export default function HelpArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const { data: article, isLoading, error } = useHelpArticle(slug || '');
  const { submitFeedback } = useArticleFeedback(article?.id || '');

  const { data: relatedArticles } = useHelpArticles({
    category: article?.category,
    published: true,
  });

  const handleFeedback = async (isHelpful: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFeedbackGiven(isHelpful);
    if (!isHelpful) {
      setShowCommentBox(true);
    } else {
      await submitFeedback.mutateAsync({ isHelpful });
    }
  };

  const handleSubmitFeedback = async () => {
    await submitFeedback.mutateAsync({ 
      isHelpful: feedbackGiven!, 
      comment: feedbackComment 
    });
    setShowCommentBox(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Article not found</p>
              <Button onClick={() => navigate('/help')}>Back to Help Center</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const categoryInfo = HELP_CATEGORIES.find(c => c.value === article.category);
  const filteredRelated = relatedArticles?.filter(a => a.id !== article.id).slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-background">
      {article && (
        <Seo
          title={`${article.title} — Help Center`}
          description={article.excerpt || article.title}
          path={`/help/article/${article.slug}`}
          type="article"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            datePublished: article.created_at,
            dateModified: article.updated_at,
            author: { "@type": "Organization", name: "Let's Get REAL" },
          }}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate('/help')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Help Center
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{categoryInfo?.label}</span>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article>
              <header className="mb-8">
                <Badge variant="secondary" className="mb-4">
                  {categoryInfo?.icon} {categoryInfo?.label}
                </Badge>
                <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {format(new Date(article.updated_at), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.view_count} views
                  </span>
                </div>
              </header>

              <Card>
                <CardContent className="py-8 prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.content}
                  </ReactMarkdown>
                </CardContent>
              </Card>

              {/* Feedback Section */}
              <Card className="mt-8">
                <CardContent className="py-6">
                  {feedbackGiven === null ? (
                    <div className="text-center">
                      <p className="font-medium mb-4">Was this article helpful?</p>
                      <div className="flex justify-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => handleFeedback(true)}
                          className="flex items-center gap-2"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Yes, it helped
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleFeedback(false)}
                          className="flex items-center gap-2"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          No, I need more help
                        </Button>
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        {article.helpful_count} found this helpful
                      </div>
                    </div>
                  ) : showCommentBox ? (
                    <div className="space-y-4">
                      <p className="font-medium">What could we improve?</p>
                      <Textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Tell us how we can make this article better..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSubmitFeedback} disabled={submitFeedback.isPending}>
                          Submit Feedback
                        </Button>
                        <Button variant="ghost" onClick={() => navigate('/help/tickets/new')}>
                          Contact Support Instead
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-primary font-medium">Thank you for your feedback!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Related Articles */}
            {filteredRelated.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredRelated.map((related) => (
                    <Link
                      key={related.id}
                      to={`/help/article/${related.slug}`}
                      className="block text-sm hover:text-primary transition-colors"
                    >
                      {related.title}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Need More Help */}
            <Card className="mt-6">
              <CardContent className="py-6 text-center">
                <p className="font-medium mb-4">Still need help?</p>
                <Button onClick={() => navigate('/help/tickets/new')} className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
