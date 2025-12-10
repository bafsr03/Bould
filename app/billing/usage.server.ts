import prisma from "../db.server";
import type { AppPlanDefinition } from "./plans";

export interface ApparelPreviewUsage {
  total: number;
}

export async function getApparelPreviewUsage(
  shopDomain: string | null | undefined,
  options?: { windowMinutes?: number | null }
): Promise<ApparelPreviewUsage> {
  // Track usage by shopDomain directly (not through conversion relation)
  // This ensures usage persists even when apparels/conversions are deleted
  const baseFilter: Record<string, unknown> = {};

  // Only count events that have a shopDomain (brand-level tracking)
  if (shopDomain) {
    baseFilter["shopDomain"] = shopDomain;
  } else {
    // If no shopDomain provided, return 0 usage (can't track without shop)
    return { total: 0 };
  }

  const windowMinutes = options?.windowMinutes ?? null;
  if (windowMinutes && windowMinutes > 0) {
    baseFilter["createdAt"] = {
      gte: new Date(Date.now() - windowMinutes * 60 * 1000),
    };
  }

  const client: any = prisma as any;
  const total = await client.widgetEvent.count({
    where: baseFilter,
  });

  return { total };
}

export function isApparelPreviewLimitExceeded(
  plan: AppPlanDefinition,
  usage: ApparelPreviewUsage
): boolean {
  const limit = plan.capabilities.apparelPreviewLimit;
  if (typeof limit !== "number") {
    return false;
  }

  return usage.total > limit;
}


