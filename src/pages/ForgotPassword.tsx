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

// Validation schemas
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(12, 'Password must be at least 12 characters');

type Step = 'request' | 'verify' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Request password reset
  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    // Validate email
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

      // Always show generic message for security (don't reveal if email exists)
      setStatusMessage("If an account exists with that email, we've sent a reset link.");
      setStep('verify');
    } catch (err) {
      console.error('Reset request error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update password (called when user clicks the email link and lands back on this page)
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password length
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError('This reset link is invalid or has expired. Request a new one.');
        } else {
          setError(updateError.message);
        }
        return;
      }

      setStep('success');
      toast({
        title: 'Password updated successfully',
        description: 'You can now log in with your new password.',
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user arrived via reset link (has access_token in URL)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setStep('verify');
      setStatusMessage('Enter your new password below.');
    }
  }, []);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-4 pb-4">
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
                Reset your password
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'request' && "Enter your email to receive a reset link"}
                {step === 'verify' && "Create a new password"}
                {step === 'success' && "Your password has been updated"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status/Error Messages */}
          {(error || statusMessage) && (
            <Alert 
              variant={error ? "destructive" : "default"}
              role="alert"
              aria-live="polite"
              className={error ? "border-destructive/50 bg-destructive/10" : "border-primary/50 bg-primary/10"}
            >
              <AlertDescription className="font-medium">
                {error || statusMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Request Reset */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="email" 
                  className="text-sm font-medium text-foreground"
                >
                  Email address
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
                    className="pl-10 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    disabled={isLoading}
                    autoComplete="email"
                    aria-describedby={error ? 'form-error' : undefined}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Enter New Password */}
          {step === 'verify' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="new-password" 
                  className="text-sm font-medium text-foreground"
                >
                  New password
                </Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" 
                    aria-hidden="true"
                  />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-12 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    disabled={isLoading}
                    autoComplete="new-password"
                    aria-describedby="password-requirements"
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
                <p id="password-requirements" className="text-xs text-muted-foreground">
                  Password must be at least 12 characters
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="confirm-password" 
                  className="text-sm font-medium text-foreground"
                >
                  Confirm new password
                </Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" 
                    aria-hidden="true"
                  />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-12 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    disabled={isLoading}
                    autoComplete="new-password"
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
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Updating...
                  </>
                ) : (
                  'Update password'
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setError(null);
                  setStatusMessage(null);
                }}
                className="w-full text-sm text-primary hover:text-primary/80 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                Request a new reset link
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
              </div>
              <p className="text-foreground font-medium" aria-live="polite">
                Password updated successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to login...
              </p>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 'success' && (
            <div className="flex items-center justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden aria-live region for dynamic updates */}
      <div id="form-error" className="sr-only" aria-live="assertive">
        {error}
      </div>
    </div>
  );
}
