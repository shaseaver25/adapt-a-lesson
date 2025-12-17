import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { signInSchema } from '@/lib/authValidation';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, signInWithOAuth } = useAuth();
  const { checkSessionLimit, createSession } = useSessionManagement();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
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
    if (isLoading) return;
    
    setFormError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const emailExists = await checkEmailExists(normalizedEmail);
      if (!emailExists) {
        setIsLoading(false);
        clearPasswordAndSetError('errors.noAccount');
        return;
      }

      const isLocked = await checkAccountLocked(normalizedEmail);
      if (isLocked) {
        setIsLoading(false);
        clearPasswordAndSetError('errors.accountLocked');
        return;
      }

      const { error, data } = await signInWithEmail(normalizedEmail, password);
      
      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('invalid password') ||
            errorMessage.includes('wrong password')) {
          const { isLocked } = await incrementFailedAttempts(normalizedEmail);
          
          if (isLocked) {
            setIsLoading(false);
            clearPasswordAndSetError('errors.accountLocked');
            return;
          }
          
          setIsLoading(false);
          clearPasswordAndSetError('errors.wrongPassword');
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
      onClose();
      navigate('/studio');
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      clearPasswordAndSetError('errors.serverError');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-0 shadow-2xl overflow-hidden p-0">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
        
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-foreground font-display">
              Welcome Back
            </DialogTitle>
            <p className="text-muted-foreground text-sm">Sign in to access your classroom</p>
          </DialogHeader>

          {/* Error Alert */}
          {formError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-2 mb-4">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isFormDisabled}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('azure')}
              disabled={isFormDisabled}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {oauthLoading === 'azure' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MicrosoftIcon />
              )}
              <span>Continue with Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="modal-email"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-background border-2 ${errors.email ? 'border-destructive' : 'border-border'} rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                disabled={isFormDisabled}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="modal-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="modal-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 bg-background border-2 ${errors.password ? 'border-destructive' : 'border-border'} rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                  disabled={isFormDisabled}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" onClick={onClose} className="text-secondary font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isFormDisabled}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New to Authentic Learning?{' '}
            <Link to="/register" onClick={onClose} className="text-secondary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
