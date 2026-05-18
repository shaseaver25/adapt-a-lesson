import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Book, MessageSquare, ChevronRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { HELP_CATEGORIES, HelpArticleCategory } from '@/types/helpCenter';
import { useAuth } from '@/hooks/useAuth';
import { Seo } from '@/components/Seo';

export default function HelpCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpArticleCategory | null>(null);

  const { data: featuredArticles, isLoading: featuredLoading } = useHelpArticles({
    featured: true,
    published: true,
  });

  const { data: searchResults, isLoading: searchLoading } = useHelpArticles({
    search: searchQuery,
    published: true,
  });

  const { data: categoryArticles, isLoading: categoryLoading } = useHelpArticles({
    category: selectedCategory || undefined,
    published: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const articlesToShow = searchQuery 
    ? searchResults 
    : selectedCategory 
      ? categoryArticles 
      : featuredArticles;

  const isLoading = searchQuery ? searchLoading : selectedCategory ? categoryLoading : featuredLoading;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Help Center — Let's Get REAL"
        description="Browse guides, tutorials, and answers about creating differentiated lessons, assessments, and rubrics."
        path="/help"
      />
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-primary-foreground hover:text-primary-foreground/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Help Center</h1>
            <p className="text-primary-foreground/80 mb-8">Find answers to your questions or contact support</p>
            
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white text-foreground"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/help/articles')}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>Browse help articles and guides</CardDescription>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/help/tickets/new')}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Submit a support ticket</CardDescription>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
        </div>

        {/* Categories */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HELP_CATEGORIES.map((category) => (
                <Card
                  key={category.value}
                  className="hover:shadow-lg transition-shadow cursor-pointer text-center"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <CardContent className="pt-6">
                    <span className="text-3xl mb-2 block">{category.icon}</span>
                    <h3 className="font-medium">{category.label}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Selected Category Header */}
        {selectedCategory && (
          <div className="mb-6">
            <Button variant="ghost" onClick={() => {
              setSelectedCategory(null);
              navigate('/');
            }} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Categories
            </Button>
            <h2 className="text-xl font-semibold">
              {HELP_CATEGORIES.find(c => c.value === selectedCategory)?.icon}{' '}
              {HELP_CATEGORIES.find(c => c.value === selectedCategory)?.label}
            </h2>
          </div>
        )}

        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setSearchQuery('')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Clear Search
            </Button>
            <h2 className="text-xl font-semibold">
              Search Results for "{searchQuery}"
            </h2>
          </div>
        )}

        {/* Articles List */}
        <div className="mb-12">
          {!searchQuery && !selectedCategory && (
            <h2 className="text-xl font-semibold mb-6">Featured Articles</h2>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : articlesToShow && articlesToShow.length > 0 ? (
            <div className="space-y-4">
              {articlesToShow.map((article) => (
                <Link key={article.id} to={`/help/article/${article.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        {article.excerpt && (
                          <CardDescription className="mt-1">{article.excerpt}</CardDescription>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No articles found matching your search.' : 'No articles in this category yet.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Tickets Section */}
        {user && (
          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Support Tickets</h2>
              <Button onClick={() => navigate('/help/tickets')}>View All Tickets</Button>
            </div>
            <Button variant="outline" onClick={() => navigate('/help/tickets/new')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Create New Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
