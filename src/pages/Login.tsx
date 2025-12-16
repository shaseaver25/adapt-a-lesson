import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { signInSchema } from '@/lib/authValidation';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';

// OAuth provider icons
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const CanvasIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#E74C3C" />
    <path fill="white" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, signInWithOAuth, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const result = signInSchema.safeParse({ email, password });
    
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = t('errors.invalidEmail');
        if (err.path[0] === 'password') fieldErrors.password = t('errors.passwordTooShort');
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const clearPasswordAndSetError = (errorKey: string) => {
    setPassword('');
    setFormError(t(errorKey));
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_email_exists', { p_email: email });
      if (error) return true;
      return data ?? false;
    } catch {
      return true;
    }
  };

  const checkAccountLocked = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_account_locked', { p_email: email });
      if (error) return false;
      return data?.[0]?.is_locked ?? false;
    } catch {
      return false;
    }
  };

  const incrementFailedAttempts = async (email: string): Promise<{ isLocked: boolean }> => {
    try {
      const { data, error } = await supabase.rpc('increment_failed_login', { p_email: email });
      if (error) return { isLocked: false };
      return { isLocked: data?.[0]?.is_locked ?? false };
    } catch {
      return { isLocked: false };
    }
  };

  const resetFailedAttempts = async (userId: string) => {
    try {
      await supabase.rpc('reset_failed_login', { p_user_id: userId });
    } catch (error) {
      console.error('Error resetting failed login:', error);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const emailExists = await checkEmailExists(email);
      if (!emailExists) {
        setIsLoading(false);
        clearPasswordAndSetError('errors.noAccount');
        return;
      }

      const isLocked = await checkAccountLocked(email);
      if (isLocked) {
        setIsLoading(false);
        clearPasswordAndSetError('errors.accountLocked');
        return;
      }

      const { error, data } = await signInWithEmail(email, password);
      
      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('invalid password') ||
            errorMessage.includes('wrong password')) {
          const { isLocked } = await incrementFailedAttempts(email);
          
          if (isLocked) {
            setIsLoading(false);
            clearPasswordAndSetError('errors.accountLocked');
            return;
          }
          
          setIsLoading(false);
          clearPasswordAndSetError('errors.wrongPassword');
          return;
        }
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
          setIsLoading(false);
          clearPasswordAndSetError('errors.networkError');
          return;
        }
        
        setIsLoading(false);
        clearPasswordAndSetError('errors.serverError');
        return;
      }

      if (data?.user?.id) {
        await resetFailedAttempts(data.user.id);
      }

      setIsLoading(false);
      toast({
        title: t('login.welcomeBack'),
        description: t('login.loginSuccess'),
      });
      navigate('/');
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      clearPasswordAndSetError('errors.serverError');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure' | 'canvas') => {
    setIsLoading(true);
    setFormError(null);
    
    try {
      const { error } = await signInWithOAuth(provider);
      setIsLoading(false);

      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('popup') || errorMessage.includes('blocked') || errorMessage.includes('window')) {
          setFormError(t('errors.popupBlocked'));
          return;
        }
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
          setFormError(t('errors.networkError'));
          return;
        }
        
        setFormError(t('errors.serverError'));
      }
    } catch (error) {
      setIsLoading(false);
      console.error('OAuth error:', error);
      setFormError(t('errors.serverError'));
    }
  };

  const isFormLoading = isLoading || authLoading;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="font-display font-bold text-2xl text-foreground">{t('login.title')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('login.subtitle')}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {formError && (
            <Alert variant="destructive" role="alert" aria-live="polite" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="font-medium">{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full h-12 gap-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => handleOAuthLogin('google')} disabled={isFormLoading} aria-label={t('login.continueWithGoogle')}>
              <GoogleIcon />
              {t('login.continueWithGoogle')}
            </Button>
            <Button type="button" variant="outline" className="w-full h-12 gap-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => handleOAuthLogin('azure')} disabled={isFormLoading} aria-label={t('login.continueWithMicrosoft')}>
              <MicrosoftIcon />
              {t('login.continueWithMicrosoft')}
            </Button>
            <Button type="button" variant="outline" className="w-full h-12 gap-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => handleOAuthLogin('canvas')} disabled={isFormLoading} aria-label={t('login.continueWithCanvas')}>
              <CanvasIcon />
              {t('login.continueWithCanvas')}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t('common.or')}</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">{t('common.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input id="email" type="email" placeholder={t('login.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${errors.email ? 'border-destructive' : ''}`} disabled={isFormLoading} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
              </div>
              {errors.email && <p id="email-error" className="text-sm text-destructive" role="alert">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">{t('common.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t('login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-12 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${errors.password ? 'border-destructive' : ''}`} disabled={isFormLoading} autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={showPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')} tabIndex={0}>
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="text-sm text-destructive" role="alert">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">{t('login.forgotPassword')}</Link>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" disabled={isFormLoading}>
              {isFormLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  {t('login.signingIn')}
                </>
              ) : t('login.loginButton')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">{t('login.signUp')}</Link>
          </p>
        </CardContent>
      </Card>

      <div id="form-error" className="sr-only" aria-live="assertive">{formError}</div>
    </div>
  );
}
