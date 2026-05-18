export const PRICING_TIERS = {
  monthly: {
    priceId: "price_1So0wcDnqCVCwtRqFp7HG0xw",
    productId: "prod_TlY2hwwSjAUHT1",
    name: "Individual",
    price: 10,
    interval: "month" as const,
    mode: "subscription" as const,
    description: "Full access to all features, billed monthly",
    trialDays: 7,
  },
  yearly: {
    priceId: "price_1So0xWDnqCVCwtRqa5VSqMH1",
    productId: "prod_TlY3dIKgwPbSyJ",
    name: "Individual",
    price: 99,
    interval: "year" as const,
    mode: "payment" as const,
    description: "Full access for one year — save $21!",
    trialDays: 0,
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
export type PricingTierInfo = (typeof PRICING_TIERS)[PricingTier];
