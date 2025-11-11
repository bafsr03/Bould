export type BillingPlanId = "starter" | "creator" | "pro";

export interface PlanCapabilities {
  analyticsAccess: boolean;
  apparelPreviewLimit?: number;
  maxStoreInstalls?: number | null;
}

export interface AppPlanDefinition {
  id: BillingPlanId;
  name: string;
  billingKey: string;
  priceLabel: string;
  amount: number;
  currencyCode: "USD";
  interval: "EVERY_30_DAYS";
  features: string[];
  cta: string;
  recommended?: boolean;
  isPaid: boolean;
  capabilities: PlanCapabilities;
}

export const APP_PLANS: AppPlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    billingKey: "Starter",
    priceLabel: "Free",
    amount: 0,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    features: [
      "Unlimited garment conversions",
      "50 image generations total (across all shoppers)",
      "One widget install per Shopify store",
    ],
    cta: "Switch to Starter",
    isPaid: false,
    capabilities: {
      analyticsAccess: false,
      apparelPreviewLimit: 2,
      maxStoreInstalls: 1,
    },
  },
  {
    id: "creator",
    name: "Creator",
    billingKey: "Creator",
    priceLabel: "$20",
    amount: 20,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    features: [
      "500 images generations/month (across all shoppers)",
      "Up to 3 store installs",
      "Advanced analytics (conversion rates, widget usage, tailor feedback)",
      "Tailor tone for recommendation feedback",
    ],
    cta: "Choose Creator",
    isPaid: true,
    capabilities: {
      analyticsAccess: true,
      maxStoreInstalls: 3,
    },
  },
  {
    id: "pro",
    name: "Pro",
    billingKey: "Pro",
    priceLabel: "$50",
    amount: 50,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    features: [
      "Unlimited image generation",
      "Custom rate limits + white-label widget",
      "API access for internal tools",
      "Priority support",
    ],
    cta: "Choose Pro",
    recommended: true,
    isPaid: true,
    capabilities: {
      analyticsAccess: true,
      maxStoreInstalls: null,
    },
  },
];

export const APP_PLAN_MAP: Record<BillingPlanId, AppPlanDefinition> = APP_PLANS.reduce(
  (accumulator, plan) => {
    accumulator[plan.id] = plan;
    return accumulator;
  },
  {} as Record<BillingPlanId, AppPlanDefinition>
);

export const PAID_PLAN_IDS = APP_PLANS.filter((plan) => plan.isPaid).map(
  (plan) => plan.id
);

export const BILLING_PLAN_KEYS = APP_PLANS.reduce(
  (accumulator, plan) => {
    accumulator[plan.id] = plan.billingKey;
    return accumulator;
  },
  {} as Record<BillingPlanId, string>
);

export const PAID_BILLING_PLAN_KEYS = PAID_PLAN_IDS.map(
  (planId) => BILLING_PLAN_KEYS[planId]
);

export function getPlanById(planId: string | null | undefined) {
  if (!planId) return undefined;
  return APP_PLANS.find((plan) => plan.id === planId);
}

export function getPlanByBillingKey(billingKey: string | null | undefined) {
  if (!billingKey) return undefined;
  return APP_PLANS.find((plan) => plan.billingKey === billingKey);
}


