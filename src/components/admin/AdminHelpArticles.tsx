import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useHelpArticles, useCreateHelpArticle, useUpdateHelpArticle, useDeleteHelpArticle } from '@/hooks/useHelpArticles';
import { HELP_CATEGORIES, HelpArticle, HelpArticleCategory } from '@/types/helpCenter';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminHelpArticles() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: articles, isLoading } = useHelpArticles({
    published: statusFilter === 'all' ? undefined : statusFilter === 'published',
  });

  const createArticle = useCreateHelpArticle();
  const updateArticle = useUpdateHelpArticle();
  const deleteArticle = useDeleteHelpArticle();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'getting-started' as HelpArticleCategory,
    tags: [] as string[],
    search_keywords: '',
    display_order: 0,
    is_featured: false,
    is_published: false,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const openEditor = (article?: HelpArticle) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt || '',
        category: article.category,
        tags: article.tags || [],
        search_keywords: article.search_keywords || '',
        display_order: article.display_order,
        is_featured: article.is_featured,
        is_published: article.is_published,
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        category: 'getting-started',
        tags: [],
        search_keywords: '',
        display_order: 0,
        is_featured: false,
        is_published: false,
      });
    }
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      if (editingArticle) {
        await updateArticle.mutateAsync({
          id: editingArticle.id,
          ...formData,
        });
      } else {
        await createArticle.mutateAsync(formData);
      }
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const togglePublished = async (article: HelpArticle) => {
    await updateArticle.mutateAsync({
      id: article.id,
      is_published: !article.is_published,
    });
  };

  const toggleFeatured = async (article: HelpArticle) => {
    await updateArticle.mutateAsync({
      id: article.id,
      is_featured: !article.is_featured,
    });
  };

  const filteredArticles = articles?.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const getCategoryInfo = (category: string) => {
    return HELP_CATEGORIES.find(c => c.value === category);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Help Articles</h2>
          <p className="text-muted-foreground">Manage knowledge base articles</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
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
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{articles?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {articles?.filter(a => a.is_published).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {articles?.filter(a => a.is_featured).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {articles?.reduce((sum, a) => sum + a.view_count, 0) || 0}
            </div>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Articles Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Helpful %</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map(article => {
                  const categoryInfo = getCategoryInfo(article.category);
                  const totalVotes = article.helpful_count + article.not_helpful_count;
                  const helpfulPercent = totalVotes > 0 
                    ? Math.round((article.helpful_count / totalVotes) * 100) 
                    : null;

                  return (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {article.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          <div>
                            <p className="font-medium">{article.title}</p>
                            <p className="text-xs text-muted-foreground">/help/article/{article.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categoryInfo?.icon} {categoryInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={article.is_published ? 'default' : 'secondary'}>
                          {article.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{article.view_count}</TableCell>
                      <TableCell className="text-right">
                        {helpfulPercent !== null ? `${helpfulPercent}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(article.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFeatured(article)}
                            title={article.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <Star className={`h-4 w-4 ${article.is_featured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublished(article)}
                            title={article.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {article.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditor(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/help/article/${article.slug}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(article.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No articles found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Article Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'New Article'}</DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Update the article details below' : 'Create a new help article'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: editingArticle ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  placeholder="Article title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="article-url-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as HelpArticleCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HELP_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary for search results"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">{formData.excerpt.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content * (Markdown supported)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your article content here... Markdown is supported."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Search Keywords</Label>
              <Input
                id="keywords"
                value={formData.search_keywords}
                onChange={(e) => setFormData({ ...formData, search_keywords: e.target.value })}
                placeholder="Additional keywords for search (comma separated)"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createArticle.isPending || updateArticle.isPending}>
              {createArticle.isPending || updateArticle.isPending ? 'Saving...' : 'Save Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteArticle.isPending}
            >
              {deleteArticle.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
