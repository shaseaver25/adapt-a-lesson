import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminCosts } from '@/components/admin/AdminCosts';
import { AdminFeatureFlags } from '@/components/admin/AdminFeatureFlags';
import { AdminErrorLogs } from '@/components/admin/AdminErrorLogs';
import { AdminActivityLog } from '@/components/admin/AdminActivityLog';
import AdminFeedback from '@/components/admin/AdminFeedback';
import AdminHelpArticles from '@/components/admin/AdminHelpArticles';
import AdminSupportTickets from '@/components/admin/AdminSupportTickets';
import { Shield, Users, BarChart3, DollarSign, ToggleLeft, AlertTriangle, Activity, FolderOpen, TableProperties, ShieldCheck, Users as UsersIcon, Volume2, Home, MessageSquare, BookOpen, TicketCheck } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

export default function Admin() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/studio');
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display font-bold text-xl text-primary">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Authentic Learning Studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/studio">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Studio</span>
              </Button>
            </Link>
            <Link to="/saved-lessons">
              <Button variant="ghost" size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Lessons</span>
              </Button>
            </Link>
            <Link to="/saved-rubrics">
              <Button variant="ghost" size="sm" className="gap-2">
                <TableProperties className="h-4 w-4" />
                <span className="hidden sm:inline">Rubrics</span>
              </Button>
            </Link>
            <Link to="/saved-assessments">
              <Button variant="ghost" size="sm" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Assessments</span>
              </Button>
            </Link>
            <Link to="/student-groups">
              <Button variant="outline" size="sm" className="gap-2">
                <UsersIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Student Groups</span>
              </Button>
            </Link>
            <Link to="/audio-usage">
              <Button variant="ghost" size="sm" className="gap-2">
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Audio</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="help-articles" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Articles</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <TicketCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">AI Costs</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Errors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="feedback">
            <AdminFeedback />
          </TabsContent>

          <TabsContent value="help-articles">
            <AdminHelpArticles />
          </TabsContent>

          <TabsContent value="tickets">
            <AdminSupportTickets />
          </TabsContent>

          <TabsContent value="activity">
            <AdminActivityLog />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="costs">
            <AdminCosts />
          </TabsContent>

          <TabsContent value="features">
            <AdminFeatureFlags />
          </TabsContent>

          <TabsContent value="errors">
            <AdminErrorLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
