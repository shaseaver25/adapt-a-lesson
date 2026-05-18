import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { checkSubscription, isSubscribed, tier, loading } = useSubscription();

  // Refresh subscription status on mount
  useEffect(() => {
    // Small delay to allow Stripe to process
    const timer = setTimeout(() => {
      checkSubscription();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="border-primary/20">
          <CardContent className="pt-8 pb-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome to RealPath Learning!
            </h1>

            <p className="text-muted-foreground mb-6">
              {loading ? (
                'Confirming your subscription...'
              ) : isSubscribed ? (
                <>
                  You now have full access to all features with your{' '}
                  <span className="font-semibold text-primary">
                    {tier === 'monthly' ? 'Monthly' : 'Yearly'}
                  </span>{' '}
                  plan.
                </>
              ) : (
                'Your payment was successful. Your access is being activated...'
              )}
            </p>

            {/* Features preview */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                What you can do now:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Create differentiated lessons in 60 seconds
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Generate authentic assessments
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Build AI-proof rubrics
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Support 12+ languages with audio
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Link to="/studio">
              <Button className="w-full" size="lg">
                Go to Studio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            {/* Session info for debugging */}
            {sessionId && (
              <p className="text-xs text-muted-foreground mt-4">
                Session: {sessionId.slice(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <a href="mailto:support@letsgetreal.app" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
