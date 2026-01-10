import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Sparkles, X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SubscriptionBannerProps {
  isTrialing: boolean;
  daysRemaining: number | null;
  tier: 'monthly' | 'yearly' | null;
  subscriptionEnd: string | null;
  isSubscribed?: boolean;
}

export function SubscriptionBanner({ 
  isTrialing, 
  daysRemaining, 
  tier,
  subscriptionEnd,
  isSubscribed = false,
}: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Show "Get Free Access" banner for non-subscribed users
  if (!isSubscribed && !isTrialing) {
    return (
      <div className="border-b bg-accent/10 border-accent/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Gift className="h-4 w-4 text-accent-foreground" />
          <span>
            Get 30 days free access by sharing your feedback!
          </span>
          <Link to="/feedback">
            <Button variant="link" size="sm" className="h-auto p-0 text-accent-foreground font-semibold">
              Give Feedback
            </Button>
          </Link>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Show trial banner
  if (isTrialing && daysRemaining !== null) {
    const isUrgent = daysRemaining <= 2;
    
    return (
      <div className={`border-b px-4 py-2 flex items-center justify-between ${
        isUrgent 
          ? 'bg-warning/10 border-warning/30 text-warning-foreground' 
          : 'bg-secondary/50 border-secondary'
      }`}>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {isUrgent ? (
            <AlertTriangle className="h-4 w-4 text-warning" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <span>
            {daysRemaining === 0 
              ? 'Your free trial ends today!' 
              : daysRemaining === 1 
                ? 'Your free trial ends tomorrow!' 
                : `Your free trial ends in ${daysRemaining} days.`}
          </span>
          <Link to="/pricing">
            <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold">
              Upgrade Now
            </Button>
          </Link>
          <span className="text-muted-foreground">or</span>
          <Link to="/feedback">
            <Button variant="link" size="sm" className="h-auto p-0 text-accent-foreground font-semibold">
              Extend Free
            </Button>
          </Link>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Show active subscription info (optional, subtle)
  if (tier && subscriptionEnd && daysRemaining !== null && daysRemaining <= 7) {
    const renewDate = new Date(subscriptionEnd).toLocaleDateString();
    
    return (
      <div className="border-b bg-success/5 border-success/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-success" />
          <span>
            Your {tier === 'monthly' ? 'subscription renews' : 'yearly access expires'} on {renewDate}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return null;
}
