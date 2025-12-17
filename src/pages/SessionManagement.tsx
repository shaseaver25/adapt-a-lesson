import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, Tablet, Laptop, Trash2, LogOut, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManagement, UserSession } from '@/hooks/useSessionManagement';
import { useTranslation } from '@/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';

const getDeviceIcon = (deviceInfo: string | null) => {
  const info = deviceInfo?.toLowerCase() || '';
  if (info.includes('iphone') || info.includes('android') || info.includes('mobile')) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (info.includes('ipad') || info.includes('tablet')) {
    return <Tablet className="h-5 w-5" />;
  }
  if (info.includes('mac') || info.includes('windows') || info.includes('linux')) {
    return <Laptop className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

export default function SessionManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useTranslation();
  const {
    sessions,
    loading,
    error,
    fetchSessions,
    removeSession,
    removeAllOtherSessions,
  } = useSessionManagement();

  const [removingSessionId, setRemovingSessionId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchSessions(user.id);
    }
  }, [user, authLoading, navigate, fetchSessions]);

  const handleRemoveSession = async (session: UserSession) => {
    if (!user) return;
    
    setRemovingSessionId(session.id);
    const success = await removeSession(user.id, session.session_id);
    setRemovingSessionId(null);

    if (success) {
      toast({
        title: t('sessions.sessionRemoved'),
        description: t('sessions.sessionRemovedDesc'),
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('sessions.removeError'),
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAllOther = async () => {
    if (!user) return;
    
    setRemovingAll(true);
    const success = await removeAllOtherSessions(user.id);
    setRemovingAll(false);

    if (success) {
      toast({
        title: t('sessions.allSessionsRemoved'),
        description: t('sessions.allSessionsRemovedDesc'),
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('sessions.removeAllError'),
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/studio')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t('sessions.title')}</h1>
          <p className="text-muted-foreground">{t('sessions.description')}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Session */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('sessions.currentSession')}</CardTitle>
            <CardDescription>{t('sessions.currentSessionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.filter(s => s.is_current).map(session => (
              <div key={session.id} className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {getDeviceIcon(session.device_info)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{session.device_info || t('sessions.unknownDevice')}</p>
                    <Badge variant="default" className="shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('sessions.thisDevice')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('sessions.lastActive')}: {formatDate(session.last_active_at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Other Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('sessions.otherSessions')}</CardTitle>
                <CardDescription>
                  {otherSessions.length === 0 
                    ? t('sessions.noOtherSessions') 
                    : t('sessions.otherSessionsCount', { count: otherSessions.length.toString() })}
                </CardDescription>
              </div>
              {otherSessions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAllOther}
                  disabled={removingAll}
                  className="gap-2"
                >
                  {removingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {t('sessions.logOutAll')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : otherSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('sessions.onlyThisDevice')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherSessions.map(session => (
                  <div key={session.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
                    <div className="p-2 rounded-full bg-muted text-muted-foreground">
                      {getDeviceIcon(session.device_info)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{session.device_info || t('sessions.unknownDevice')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('sessions.lastActive')}: {formatDate(session.last_active_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSession(session)}
                      disabled={removingSessionId === session.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label={t('sessions.removeSession')}
                    >
                      {removingSessionId === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Card>
          <CardContent className="pt-6">
            <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              {t('sessions.signOut')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
