import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PricingGridProps {
  onCtaClick: () => void;
  onContactSales?: () => void;
}

const tiers = [
  {
    name: 'INDIVIDUAL',
    price: '$19',
    interval: '/month',
    description: 'Perfect for individual teachers',
    features: [
      '60 tokens/month',
      'All differentiation features',
      '100% WCAG 2.1 AA compliant',
    ],
    ctaLabel: 'Get Started',
    popular: false,
  },
  {
    name: 'SCHOOL TEAM',
    price: '$149',
    interval: '/month',
    description: 'For departments & grade levels',
    features: [
      '400 shared tokens/month',
      'Up to 10 teachers',
      'Admin dashboard & reporting',
      'Priority support',
    ],
    ctaLabel: 'Get Started',
    popular: true,
  },
  {
    name: 'DISTRICT',
    price: '$2,000',
    interval: '+/month',
    description: 'Enterprise solution for districts',
    features: [
      'Unlimited teachers',
      'SSO integration',
      'Dedicated success manager',
      'Custom training & onboarding',
    ],
    ctaLabel: 'Contact Sales',
    popular: false,
  },
];

export function PricingGrid({ onCtaClick, onContactSales }: PricingGridProps) {
  return (
    <section className="py-24 px-4 md:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Choose the plan that fits your needs. All plans include WCAG 2.1 AA compliance built in.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                tier.popular
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  MOST POPULAR
                </Badge>
              )}

              <div className="text-sm font-semibold text-primary mb-2">{tier.name}</div>
              <div className="mb-4">
                <span className="font-display text-4xl font-bold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground">{tier.interval}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={tier.name === 'DISTRICT' ? onContactSales : onCtaClick}
                variant={tier.popular ? 'hero' : 'default'}
                className="w-full"
              >
                {tier.ctaLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
