import { useState, FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { signUpSchema, getAuthErrorMessage } from '@/lib/authValidation';

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else if (password.length >= 4) score += 5;
  
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  
  // Bonus for length
  if (password.length >= 16) score += 15;
  
  if (score >= 80) return { score, label: 'Strong', color: 'bg-green-500' };
  if (score >= 50) return { score, label: 'Medium', color: 'bg-yellow-500' };
  if (score >= 25) return { score, label: 'Weak', color: 'bg-orange-500' };
  return { score: Math.max(score, 5), label: 'Very weak', color: 'bg-destructive' };
}

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUpWithEmail, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const meetsMinLength = password.length >= 12;

  const validateForm = (): boolean => {
    const result = signUpSchema.safeParse({ email, password, confirmPassword });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const { error } = await signUpWithEmail(email, password);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Registration failed',
        description: getAuthErrorMessage(error.message),
        variant: 'destructive',
      });
      return;
    }

    setSuccessMessage('Check your email to verify your account before logging in');
    
    // Redirect to login after showing success message
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  const isFormLoading = isLoading || authLoading;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-4 pb-4">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <svg
                className="h-10 w-10 text-primary"
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
              <h1 className="font-display font-bold text-2xl text-foreground">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Join Authentic Learning Studio
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
              role="status"
              aria-live="polite"
            >
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-green-800 dark:text-green-200">
                {successMessage}
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.email ? 'border-destructive' : ''
                  }`}
                  disabled={isFormLoading || !!successMessage}
                  autoComplete="email"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-12 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.password ? 'border-destructive' : ''
                  }`}
                  disabled={isFormLoading || !!successMessage}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby="password-requirements password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              <p
                id="password-requirements"
                className={`text-sm ${
                  meetsMinLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                {meetsMinLength ? '✓ ' : ''}Password must be at least 12 characters
              </p>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                        role="progressbar"
                        aria-valuenow={passwordStrength.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Password strength: ${passwordStrength.label}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-16">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirm password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-12 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.confirmPassword ? 'border-destructive' : ''
                  }`}
                  disabled={isFormLoading || !!successMessage}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? 'confirm-password-error'
                      : confirmPassword.length > 0
                      ? 'password-match-status'
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Match Status */}
              {confirmPassword.length > 0 && (
                <p
                  id="password-match-status"
                  className={`text-sm ${
                    passwordsMatch
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-destructive'
                  }`}
                  aria-live="polite"
                >
                  {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match'}
                </p>
              )}

              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              disabled={isFormLoading || !!successMessage}
            >
              {isFormLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
