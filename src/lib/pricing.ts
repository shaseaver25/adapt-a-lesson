export const PRICING_TIERS = {
  monthly: {
    priceId: "price_1So0wqDnqCVCwtRquWiEdV90",
    productId: "prod_TlY3S8sEWv59zN",
    name: "Let's Get REAL Monthly",
    price: 10,
    interval: "month" as const,
    mode: "subscription" as const,
    description: "Full access to all features, billed monthly",
  },
  yearly: {
    priceId: "price_1So0xWDnqCVCwtRqa5VSqMH1",
    productId: "prod_TlY3dIKgwPbSyJ",
    name: "Let's Get REAL Yearly",
    price: 99,
    interval: "year" as const,
    mode: "payment" as const,
    description: "Full access for one year — save $21!",
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
export type PricingTierInfo = (typeof PRICING_TIERS)[PricingTier];
