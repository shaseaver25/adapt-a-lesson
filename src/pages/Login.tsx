import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { signInSchema } from '@/lib/authValidation';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';

// OAuth provider icons
const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const CanvasIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#E74C3C" />
    <path fill="white" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
  </svg>
);

// Loading skeleton
const LoginSkeleton = () => (
  <div className="auth-background">
    <div className="orb orb-green" />
    <div className="orb orb-gold" />
    <div className="orb orb-clay" />
    <div className="orb orb-accent" />
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signInWithEmail, signInWithOAuth, loading: authLoading } = useAuth();
  const { checkSessionLimit, createSession } = useSessionManagement();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsCheckingSession(false);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (isCheckingSession || (authLoading && !isLoading)) {
    return (
      <>
        <LoginSkeleton />
        <div className="auth-container">
          <div className="auth-wrapper">
            <div className="glass-card animate-pulse">
              <div className="h-12 bg-muted rounded-lg mb-4" />
              <div className="h-12 bg-muted rounded-lg mb-4" />
              <div className="h-12 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </>
    );
  }

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
    if (isLoading) return;
    
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
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
          setIsLoading(false);
          clearPasswordAndSetError('errors.networkError');
          return;
        }
        
        setIsLoading(false);
        clearPasswordAndSetError('errors.serverError');
        return;
      }

      if (data?.user?.id) {
        const { allowed } = await checkSessionLimit(data.user.id);
        if (!allowed) {
          setIsLoading(false);
          clearPasswordAndSetError('errors.tooManyDevices');
          return;
        }

        await createSession(data.user.id);
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
    if (isLoading || oauthLoading) return;
    
    setOauthLoading(provider);
    setFormError(null);
    
    try {
      const { error } = await signInWithOAuth(provider);
      
      if (error) {
        setOauthLoading(null);
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          setFormError(t('errors.popupBlocked'));
          return;
        }
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
          setFormError(t('errors.networkError'));
          return;
        }
        
        setFormError(t('errors.serverError'));
      }
    } catch (error) {
      setOauthLoading(null);
      console.error('OAuth error:', error);
      setFormError(t('errors.serverError'));
    }
  };

  const isFormDisabled = isLoading || !!oauthLoading;

  return (
    <>
      {/* Animated Orb Background */}
      <div className="auth-background">
        <div className="orb orb-green" />
        <div className="orb orb-gold" />
        <div className="orb orb-clay" />
        <div className="orb orb-accent" />
      </div>

      {/* Language Selector */}
      <div className="auth-lang-selector">
        <LanguageSelector />
      </div>

      {/* Main Content */}
      <div className="auth-container">
        <div className="auth-wrapper animate-fade-in">
          {/* Brand Header */}
          <header className="brand-header">
            <div className="brand-logo">
              <img 
                src="/real-logo.png" 
                alt="REAL Logo" 
                width={72} 
                height={72}
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="brand-name">Authentic Learning Studio</span>
            </div>
            <p className="brand-tagline">{t('login.subtitle')}</p>
            
            <h1 className="hero-headline">
              <span className="text-forest">Let's Get </span>
              <span className="text-gold">REAL</span>
            </h1>
            <p className="hero-subline">Responsive. Equitable. Adaptive. Learning.</p>
            <p className="hero-support">One lesson. Designed to accommodate every learner.</p>
          </header>

          {/* Login Card */}
          <div className="glass-card">
            {/* Error Alert */}
            {formError && (
              <div className="auth-alert" role="alert" aria-live="polite">
                <AlertCircle className="auth-alert-icon" aria-hidden="true" />
                <span className="auth-alert-message">{formError}</span>
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                className="btn-oauth"
                onClick={() => handleOAuthLogin('google')}
                disabled={isFormDisabled}
                aria-label={t('login.continueWithGoogle')}
                aria-busy={oauthLoading === 'google'}
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <GoogleIcon />
                )}
                <span>{t('login.continueWithGoogle')}</span>
              </button>

              <button
                type="button"
                className="btn-oauth"
                onClick={() => handleOAuthLogin('azure')}
                disabled={isFormDisabled}
                aria-label={t('login.continueWithMicrosoft')}
                aria-busy={oauthLoading === 'azure'}
              >
                {oauthLoading === 'azure' ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <MicrosoftIcon />
                )}
                <span>{t('login.continueWithMicrosoft')}</span>
              </button>

              <button
                type="button"
                className="btn-oauth"
                onClick={() => handleOAuthLogin('canvas')}
                disabled={isFormDisabled}
                aria-label={t('login.continueWithCanvas')}
                aria-busy={oauthLoading === 'canvas'}
              >
                {oauthLoading === 'canvas' ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <CanvasIcon />
                )}
                <span>{t('login.continueWithCanvas')}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span>{t('common.or')}</span>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} noValidate>
              <div className="mb-4">
                <label htmlFor="email" className="auth-label">
                  {t('common.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`auth-input ${errors.email ? 'has-error' : ''}`}
                  disabled={isFormDisabled}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="field-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="auth-label">
                  {t('common.password')}
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`auth-input ${errors.password ? 'has-error' : ''}`}
                    style={{ paddingRight: '52px' }}
                    disabled={isFormDisabled}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isFormDisabled}
                    aria-label={showPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="field-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isFormDisabled}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <span>{t('login.loginButton')}</span>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="auth-links">
              <Link to="/forgot-password" className="link-forest">
                {t('login.forgotPassword')}
              </Link>
              <Link to="/register" className="link-clay">
                {t('login.createAccount')}
              </Link>
            </div>

            {/* Legal Text */}
            <p className="legal-text">
              {t('login.legalText')} <a href="/terms">{t('login.terms')}</a> {t('common.and')} <a href="/privacy">{t('login.privacy')}</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
