export const PRICING_TIERS = {
  individual: {
    priceId: "price_1So0wcDnqCVCwtRqFp7HG0xw",
    productId: "prod_TlY2hwwSjAUHT1",
    name: "Individual",
    price: 19,
    interval: "month" as const,
    mode: "subscription" as const,
    description: "Perfect for individual teachers",
    trialDays: 7,
    features: [
      "60 tokens/month",
      "All differentiation features",
      "100% WCAG 2.1 AA compliant",
    ],
  },
  school: {
    priceId: null,
    productId: null,
    name: "School Team",
    price: 149,
    interval: "month" as const,
    mode: "subscription" as const,
    description: "For departments & grade levels",
    trialDays: 0,
    features: [
      "600 shared tokens/month",
      "Up to 10 teachers",
      "Admin dashboard & reporting",
      "Priority support",
    ],
  },
  district: {
    priceId: null,
    productId: null,
    name: "District",
    price: 2000,
    interval: "month" as const,
    mode: "subscription" as const,
    description: "Enterprise solution for districts",
    trialDays: 0,
    features: [
      "6,000 shared tokens/month",
      "Up to 100 teachers",
      "SSO integration",
      "Dedicated success manager",
      "Custom training & onboarding",
    ],
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
export type PricingTierInfo = (typeof PRICING_TIERS)[PricingTier];
