import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useTranslation } from '@/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';

type Step = 'request' | 'verify' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    setError(null);
    setStatusMessage(null);

    const emailSchema = z.string().email(t('errors.invalidEmail'));
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (resetError) {
        console.error('Reset error:', resetError);
      }

      setStatusMessage(t('forgotPassword.emailSent'));
      setStep('verify');
    } catch (err) {
      console.error('Reset request error:', err);
      setError(t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    setError(null);

    if (newPassword.length < 12) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('errors.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError(t('errors.invalidResetLink'));
        } else {
          setError(updateError.message);
        }
        return;
      }

      setStep('success');
      toast({
        title: t('forgotPassword.passwordUpdated'),
        description: t('login.loginSuccess'),
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setStep('verify');
      setStatusMessage(t('forgotPassword.enterNewPassword'));
    }
  }, [t]);

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-hero flex items-center justify-center p-4 sm:p-6">
      {/* Language Selector */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md shadow-lg border-border animate-fade-in">
        <CardHeader className="space-y-4 pb-4 px-4 sm:px-6">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-xl bg-primary/10 transition-transform duration-200 hover:scale-105">
              <svg 
                className="h-8 w-8 sm:h-10 sm:w-10 text-primary" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground">{t('forgotPassword.title')}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'request' && t('forgotPassword.requestSubtitle')}
                {step === 'verify' && t('forgotPassword.verifySubtitle')}
                {step === 'success' && t('forgotPassword.successSubtitle')}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6 px-4 sm:px-6 pb-6">
          {/* Alert with animation */}
          <div 
            className={`transition-all duration-300 ease-out ${
              (error || statusMessage) 
                ? 'opacity-100 max-h-24 translate-y-0' 
                : 'opacity-0 max-h-0 -translate-y-2 overflow-hidden'
            }`}
            role="alert"
            aria-live="polite"
          >
            {(error || statusMessage) && (
              <Alert 
                variant={error ? "destructive" : "default"} 
                className={error ? "border-destructive/50 bg-destructive/10" : "border-primary/50 bg-primary/10"}
              >
                <AlertDescription className="font-medium">{error || statusMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Request Reset Form */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t('common.email')}
                </Label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" 
                    aria-hidden="true" 
                  />
                  <Input 
                    id="email" 
                    type="email"
                    inputMode="email"
                    placeholder={t('login.emailPlaceholder')} 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-10 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                    disabled={isLoading} 
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    aria-describedby={error ? 'form-error' : undefined} 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px] h-12 text-base font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60" 
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>{t('forgotPassword.sending')}</span>
                  </>
                ) : (
                  t('forgotPassword.sendResetLink')
                )}
              </Button>
            </form>
          )}

          {/* Verify/Update Password Form */}
          {step === 'verify' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                  {t('common.newPassword')}
                </Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" 
                    aria-hidden="true" 
                  />
                  <Input 
                    id="new-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder={t('register.passwordPlaceholder')} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="pl-10 pr-12 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                    disabled={isLoading} 
                    autoComplete="new-password" 
                    aria-describedby="password-requirements" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95" 
                    aria-label={showPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                    aria-pressed={showPassword}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p id="password-requirements" className="text-xs text-muted-foreground">
                  {t('register.passwordRequirements')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                  {t('common.confirmNewPassword')}
                </Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" 
                    aria-hidden="true" 
                  />
                  <Input 
                    id="confirm-password" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder={t('register.confirmPasswordPlaceholder')} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="pl-10 pr-12 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                    disabled={isLoading} 
                    autoComplete="new-password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95" 
                    aria-label={showConfirmPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                    aria-pressed={showConfirmPassword}
                    tabIndex={0}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px] h-12 text-base font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60" 
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>{t('forgotPassword.updating')}</span>
                  </>
                ) : (
                  t('forgotPassword.updatePassword')
                )}
              </Button>

              <button 
                type="button" 
                onClick={() => { setStep('request'); setError(null); setStatusMessage(null); }} 
                className="w-full min-h-[44px] py-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
              >
                {t('forgotPassword.requestNewLink')}
              </button>
            </form>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 transition-transform duration-300 animate-scale-in">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
              </div>
              <p className="text-foreground font-medium" aria-live="polite">{t('forgotPassword.passwordUpdated')}</p>
              <p className="text-sm text-muted-foreground">{t('forgotPassword.redirecting')}</p>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 'success' && (
            <div className="flex items-center justify-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 min-h-[44px] py-2 px-3 -mx-3 text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {error}
      </div>
    </div>
  );
}
