import prisma from "../db.server";
import {
  APP_PLAN_MAP,
  type AppPlanDefinition,
  BILLING_PLAN_KEYS,
  getPlanByBillingKey,
  getPlanById,
  type BillingPlanId,
  PAID_BILLING_PLAN_KEYS,
} from "./plans";

export interface PlanContext {
  planId: BillingPlanId;
  plan: AppPlanDefinition;
  hasActivePayment: boolean;
  subscriptionId: string | null;
  subscriptionName: string | null;
}

const DEFAULT_PLAN_CONTEXT: PlanContext = {
  planId: "starter",
  plan: APP_PLAN_MAP.starter,
  hasActivePayment: false,
  subscriptionId: null,
  subscriptionName: null,
};

function buildPlanContext(params: {
  planId?: BillingPlanId;
  subscriptionId?: string | null;
  subscriptionName?: string | null;
  hasActivePayment?: boolean;
}): PlanContext {
  const planId = params.planId ?? "starter";
  const plan = APP_PLAN_MAP[planId];
  return {
    planId,
    plan,
    hasActivePayment: params.hasActivePayment ?? false,
    subscriptionId: params.subscriptionId ?? null,
    subscriptionName: params.subscriptionName ?? null,
  };
}

export async function resolvePlanFromBilling(billing: any): Promise<PlanContext> {
  if (!billing) {
    return DEFAULT_PLAN_CONTEXT;
  }

  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: PAID_BILLING_PLAN_KEYS as any,
    isTest: true,
  });

  if (!hasActivePayment || appSubscriptions.length === 0) {
    return DEFAULT_PLAN_CONTEXT;
  }

  const activeSubscription =
    appSubscriptions.find((subscription: any) => subscription.status === "ACTIVE") ??
    appSubscriptions[0];

  const subscriptionName: string | null = activeSubscription?.name ?? null;
  const subscriptionId: string | null = activeSubscription?.id ?? null;

  if (!subscriptionName) {
    return buildPlanContext({
      hasActivePayment,
      subscriptionId,
      subscriptionName,
    });
  }

  const plan = getPlanByBillingKey(subscriptionName);
  if (!plan) {
    return buildPlanContext({
      hasActivePayment,
      subscriptionId,
      subscriptionName,
    });
  }

  return buildPlanContext({
    planId: plan.id,
    hasActivePayment,
    subscriptionId,
    subscriptionName,
  });
}

export async function persistPlanContext(
  shopDomain: string | null | undefined,
  context: PlanContext
) {
  if (!shopDomain) {
    return;
  }

  await prisma.shopPlan.upsert({
    where: { shopDomain },
    update: {
      planId: context.planId,
      billingKey: BILLING_PLAN_KEYS[context.planId],
      hasActivePayment: context.hasActivePayment,
      activeSubscriptionId: context.subscriptionId,
      activeSubscriptionName: context.subscriptionName,
    },
    create: {
      shopDomain,
      planId: context.planId,
      billingKey: BILLING_PLAN_KEYS[context.planId],
      hasActivePayment: context.hasActivePayment,
      activeSubscriptionId: context.subscriptionId,
      activeSubscriptionName: context.subscriptionName,
    },
  });
}

export async function resolveAndStorePlan(
  billing: any,
  shopDomain: string | null | undefined
): Promise<PlanContext> {
  const context = await resolvePlanFromBilling(billing);
  await persistPlanContext(shopDomain, context);
  return context;
}

export async function getStoredPlan(
  shopDomain: string | null | undefined
): Promise<PlanContext> {
  if (!shopDomain) {
    return DEFAULT_PLAN_CONTEXT;
  }

  const record = await prisma.shopPlan.findUnique({
    where: { shopDomain },
  });

  if (!record) {
    return DEFAULT_PLAN_CONTEXT;
  }

  let planDefinition = getPlanById(record.planId as BillingPlanId);
  if (!planDefinition && record.billingKey) {
    const entry = (Object.entries(BILLING_PLAN_KEYS) as Array<[BillingPlanId, string]>).find(
      ([, billingKey]) => billingKey === record.billingKey
    );
    if (entry) {
      planDefinition = APP_PLAN_MAP[entry[0]];
    }
  }
  if (!planDefinition) {
    planDefinition = APP_PLAN_MAP.starter;
  }

  return {
    planId: planDefinition.id as BillingPlanId,
    plan: planDefinition,
    hasActivePayment: record.hasActivePayment,
    subscriptionId: record.activeSubscriptionId ?? null,
    subscriptionName: record.activeSubscriptionName ?? null,
  };
}

export async function getPlanForShop({
  billing,
  shopDomain,
}: {
  billing?: any;
  shopDomain?: string | null;
}): Promise<PlanContext> {
  if (billing) {
    return resolveAndStorePlan(billing, shopDomain);
  }

  return getStoredPlan(shopDomain);
}

export { DEFAULT_PLAN_CONTEXT };

