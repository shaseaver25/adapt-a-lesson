import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PRICING_TIERS } from '@/lib/pricing';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'trial_expired' | 'subscription_expired' | 'no_subscription';
  onCheckout: (tier: 'monthly' | 'yearly') => Promise<void>;
}

export function UpgradePromptModal({ 
  isOpen, 
  onClose, 
  reason,
  onCheckout 
}: UpgradePromptModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'yearly' | null>(null);

  const handleCheckout = async (tier: 'monthly' | 'yearly') => {
    setCheckoutLoading(tier);
    try {
      await onCheckout(tier);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const title = reason === 'trial_expired' 
    ? 'Your Free Trial Has Ended'
    : reason === 'subscription_expired'
      ? 'Your Subscription Has Expired'
      : 'Subscribe to Continue';

  const description = reason === 'trial_expired'
    ? "We hope you've enjoyed your trial! Subscribe now to keep creating personalized lessons for every learner."
    : reason === 'subscription_expired'
      ? 'Renew your subscription to continue accessing all features.'
      : 'Subscribe to access the full Let\'s Get REAL experience.';

  const features = [
    'Unlimited differentiated lessons',
    'Authentic assessment generator',
    'AI-powered rubric builder',
    'Audio generation for ELL students',
    'Multilingual vocabulary support',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What you'll get:</p>
            <ul className="space-y-1.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Options */}
          <div className="grid gap-3">
            {/* Monthly */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{PRICING_TIERS.monthly.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${PRICING_TIERS.monthly.price}/month • 7-day free trial
                  </p>
                </div>
                <Button 
                  onClick={() => handleCheckout('monthly')}
                  disabled={checkoutLoading !== null}
                  size="sm"
                >
                  {checkoutLoading === 'monthly' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Start Trial'
                  )}
                </Button>
              </div>
            </div>

            {/* Yearly */}
            <div className="border rounded-lg p-4 space-y-2 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{PRICING_TIERS.yearly.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${PRICING_TIERS.yearly.price}/year • Save $21!
                  </p>
                </div>
                <Button 
                  onClick={() => handleCheckout('yearly')}
                  disabled={checkoutLoading !== null}
                  size="sm"
                  variant="default"
                >
                  {checkoutLoading === 'yearly' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Link to full pricing page */}
          <div className="text-center">
            <Link to="/pricing" onClick={onClose}>
              <Button variant="link" className="text-sm">
                View full pricing details →
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
