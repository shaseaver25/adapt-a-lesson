import { useState, FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { signUpSchema, getAuthErrorMessage } from '@/lib/authValidation';
import { useTranslation } from '@/i18n';
import { LanguageSelector } from '@/components/LanguageSelector';

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
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
  
  if (score >= 80) return { score, label: 'strong', color: 'bg-green-500' };
  if (score >= 50) return { score, label: 'good', color: 'bg-yellow-500' };
  if (score >= 25) return { score, label: 'fair', color: 'bg-orange-500' };
  return { score: Math.max(score, 5), label: 'weak', color: 'bg-destructive' };
}

type OrganizationType = 'school' | 'non_profit' | 'home_school' | 'other';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUpWithEmail, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('school');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    company?: string;
    organizationType?: string;
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
    const result = signUpSchema.safeParse({ 
      email, 
      password, 
      confirmPassword, 
      fullName, 
      company, 
      organizationType 
    });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        if (!fieldErrors[field]) {
          if (field === 'email') fieldErrors.email = t('errors.invalidEmail');
          else if (field === 'password') fieldErrors.password = t('errors.passwordTooShort');
          else if (field === 'confirmPassword') fieldErrors.confirmPassword = t('errors.passwordsDoNotMatch');
          else if (field === 'fullName') fieldErrors.fullName = 'Please enter your full name';
          else if (field === 'company') fieldErrors.company = 'Please enter your organization name';
          else if (field === 'organizationType') fieldErrors.organizationType = 'Please select an organization type';
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
    
    // Prevent double submission
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);

    // Normalize email to lowercase for case-insensitive login
    const normalizedEmail = email.toLowerCase().trim();
    
    const { error } = await signUpWithEmail(normalizedEmail, password, {
      fullName: fullName.trim(),
      company: company.trim(),
      organizationType,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: t('common.error'),
        description: getAuthErrorMessage(error.message),
        variant: 'destructive',
      });
      return;
    }

    setSuccessMessage(t('register.successMessage'));
    
    // Redirect to login after showing success message
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  const isFormDisabled = isLoading || authLoading || !!successMessage;

  const organizationOptions = [
    { value: 'school', label: 'School / District' },
    { value: 'non_profit', label: 'Non-Profit Organization' },
    { value: 'home_school', label: 'Home School' },
    { value: 'other', label: 'Other' },
  ] as const;

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
              <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground">
                {t('register.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('register.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6 px-4 sm:px-6 pb-6">
          {/* Success Message with animation */}
          <div
            className={`transition-all duration-300 ease-out ${
              successMessage 
                ? 'opacity-100 max-h-24 translate-y-0' 
                : 'opacity-0 max-h-0 -translate-y-2 overflow-hidden'
            }`}
          >
            {successMessage && (
              <div
                className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                role="status"
                aria-live="polite"
              >
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full Name <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`pl-10 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  disabled={isFormDisabled}
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                />
              </div>
              <div className={`transition-all duration-200 ${errors.fullName ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {errors.fullName && (
                  <p id="fullName-error" className="text-sm text-destructive" role="alert">
                    {errors.fullName}
                  </p>
                )}
              </div>
            </div>

            {/* Organization Name Field */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-foreground">
                Organization Name <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="company"
                  type="text"
                  placeholder="School, organization, or family name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`pl-10 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.company ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  disabled={isFormDisabled}
                  autoComplete="organization"
                  required
                  aria-invalid={!!errors.company}
                  aria-describedby={errors.company ? 'company-error' : undefined}
                />
              </div>
              <div className={`transition-all duration-200 ${errors.company ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {errors.company && (
                  <p id="company-error" className="text-sm text-destructive" role="alert">
                    {errors.company}
                  </p>
                )}
              </div>
            </div>

            {/* Organization Type Field */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Organization Type <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <RadioGroup
                value={organizationType}
                onValueChange={(value) => setOrganizationType(value as OrganizationType)}
                className="grid grid-cols-2 gap-2"
                disabled={isFormDisabled}
              >
                {organizationOptions.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <RadioGroupItem
                      value={option.value}
                      id={`org-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`org-${option.value}`}
                      className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium border rounded-lg cursor-pointer transition-all duration-200 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted/50"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className={`transition-all duration-200 ${errors.organizationType ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {errors.organizationType && (
                  <p id="organizationType-error" className="text-sm text-destructive" role="alert">
                    {errors.organizationType}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                {t('common.email')} <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
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
                  placeholder={t('register.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  disabled={isFormDisabled}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              <div className={`transition-all duration-200 ${errors.email ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                {t('common.password')} <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-12 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.password ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  disabled={isFormDisabled}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby="password-requirements password-error"
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

              {/* Password Requirements */}
              <p
                id="password-requirements"
                className={`text-sm transition-colors duration-200 ${
                  meetsMinLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                {meetsMinLength ? '✓ ' : ''}{t('register.passwordRequirements')}
              </p>

              {/* Password Strength Indicator */}
              <div className={`transition-all duration-300 ${password.length > 0 ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0 overflow-hidden'}`}>
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
                          aria-label={`${t('register.passwordStrength.' + passwordStrength.label)}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-16">
                        {t('register.passwordStrength.' + passwordStrength.label)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`transition-all duration-200 ${errors.password ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                {t('common.confirmPassword')} <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-12 min-h-[48px] h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  disabled={isFormDisabled}
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

              {/* Password Match Status */}
              <div className={`transition-all duration-200 ${confirmPassword.length > 0 ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {confirmPassword.length > 0 && (
                  <p
                    id="password-match-status"
                    className={`text-sm transition-colors duration-200 ${
                      passwordsMatch
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-destructive'
                    }`}
                    aria-live="polite"
                  >
                    {passwordsMatch ? '✓ Passwords match' : t('errors.passwordsDoNotMatch')}
                  </p>
                )}
              </div>

              <div className={`transition-all duration-200 ${errors.confirmPassword ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full min-h-[48px] h-12 text-base font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
              disabled={isFormDisabled}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>{t('register.creating')}</span>
                </>
              ) : (
                t('register.createAccount')
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            {t('register.haveAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              {t('register.signIn')}
            </Link>
          </p>

          {/* Terms and Privacy */}
          <p className="text-center text-xs text-muted-foreground">
            {t('register.termsPrefix')}{' '}
            <Link
              to="/terms"
              className="underline underline-offset-4 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              {t('register.terms')}
            </Link>{' '}
            {t('register.and')}{' '}
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              {t('register.privacy')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
