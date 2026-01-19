import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { PRICING_TIERS } from '@/lib/pricing';
import { toast } from 'sonner';

const features = [
  "60-second differentiated lessons",
  "Unlimited student groups",
  "12+ language support with audio",
  "Authentic assessment generator",
  "AI-proof rubric builder",
  "IEP/504 accommodations",
  "Export to PDF, Word, & LMS",
  "Priority email support",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, tier: currentTier, subscriptionEnd, loading: subLoading, createCheckout, openCustomerPortal } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (tierKey: 'monthly' | 'yearly') => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    const tier = PRICING_TIERS[tierKey];
    setCheckoutLoading(tierKey);

    try {
      await createCheckout(tier.priceId, tier.mode);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management. Please try again.');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const loading = authLoading || subLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="medium" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/studio">
                <Button variant="outline">Go to Studio</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple, transparent pricing
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full power of differentiated learning. Every plan includes all features—choose the billing that works for you.
          </p>
        </div>

        {/* Current subscription status */}
        {isSubscribed && (
          <div className="max-w-md mx-auto mb-12">
            <Card className="border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="font-display text-xl font-bold text-primary">
                      {currentTier === 'monthly' ? "Let's Get REAL Monthly" : "Let's Get REAL Yearly"}
                    </p>
                    {subscriptionEnd && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentTier === 'monthly' ? 'Renews' : 'Expires'} {formatDate(subscriptionEnd)}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className={`relative ${currentTier === 'monthly' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
            {currentTier === 'monthly' ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Your Plan
              </Badge>
            ) : (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground">
                <Gift className="w-3 h-3 mr-1" />
                7-Day Free Trial
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="font-display text-2xl">{PRICING_TIERS.monthly.name}</CardTitle>
              <CardDescription>{PRICING_TIERS.monthly.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="font-display text-5xl font-bold text-foreground">${PRICING_TIERS.monthly.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              {isSubscribed && currentTier === 'monthly' ? (
                <Button className="w-full" variant="outline" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              ) : (
                <>
                  <Button 
                    className="w-full" 
                    onClick={() => handleCheckout('monthly')}
                    disabled={loading || checkoutLoading !== null}
                  >
                    {checkoutLoading === 'monthly' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isSubscribed ? 'Switch to Monthly' : 'Start Free Trial'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No charge for 7 days. Cancel anytime.
                  </p>
                </>
              )}
            </CardFooter>
          </Card>

          {/* Yearly Plan */}
          <Card className={`relative ${currentTier === 'yearly' ? 'border-primary ring-2 ring-primary/20' : 'border-accent'}`}>
            {currentTier === 'yearly' ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Your Plan
              </Badge>
            ) : (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                Best Value — Save $21
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="font-display text-2xl">{PRICING_TIERS.yearly.name}</CardTitle>
              <CardDescription>{PRICING_TIERS.yearly.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="font-display text-5xl font-bold text-foreground">${PRICING_TIERS.yearly.price}</span>
                <span className="text-muted-foreground">/year</span>
                <p className="text-sm text-muted-foreground mt-1">
                  That's just <span className="font-semibold text-foreground">$8.25/month</span>
                </p>
              </div>
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isSubscribed && currentTier === 'yearly' ? (
                <Button className="w-full" variant="outline" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
                  onClick={() => handleCheckout('yearly')}
                  disabled={loading || checkoutLoading !== null}
                >
                  {checkoutLoading === 'yearly' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isSubscribed ? 'Switch to Yearly' : 'Get Yearly Access'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Questions? <a href="mailto:support@letsgetreal.app" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </main>
    </div>
  );
}
