import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  getPlanById,
  PAID_BILLING_PLAN_KEYS,
  type BillingPlanId,
} from "../billing/plans";

const STARTER_PLAN_ID: BillingPlanId = "starter";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return redirect("/app/pricing");
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const planId = formData.get("plan");

  if (typeof planId !== "string") {
    return json({ error: "Plan selection is required." }, { status: 400 });
  }

  const plan = getPlanById(planId);

  if (!plan) {
    return json({ error: "Invalid plan selection." }, { status: 400 });
  }

  const { billing } = await authenticate.admin(request);

  if (plan.id === STARTER_PLAN_ID) {
    const { appSubscriptions } = await billing.check({
      plans: PAID_BILLING_PLAN_KEYS as any,
      isTest: true,
    });

    const activeSubscription =
      appSubscriptions.find((subscription) => subscription.status === "ACTIVE") ??
      appSubscriptions[0];

    if (activeSubscription) {
      await billing.cancel({
        subscriptionId: activeSubscription.id,
        prorate: true,
        isTest: true,
      });
    }

    return redirect("/app/pricing?status=starter");
  }

  const returnUrl = new URL("/app/pricing?status=upgraded", request.url).toString();

  await billing.request({
    plan: plan.billingKey as never,
    isTest: true,
    returnUrl,
  });

  // billing.request never returns because it redirects the merchant to Shopify billing.
  return null;
};


