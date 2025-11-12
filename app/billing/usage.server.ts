import prisma from "../db.server";
import type { AppPlanDefinition } from "./plans";

export interface ApparelPreviewUsage {
  total: number;
}

export async function getApparelPreviewUsage(
  shopDomain: string | null | undefined,
  options?: { windowMinutes?: number | null }
): Promise<ApparelPreviewUsage> {
  const baseFilter: Record<string, unknown> = {
    conversion: { processed: true, status: "completed" },
  };

  const windowMinutes = options?.windowMinutes ?? null;
  if (windowMinutes && windowMinutes > 0) {
    baseFilter["createdAt"] = {
      gte: new Date(Date.now() - windowMinutes * 60 * 1000),
    };
  }

  if (shopDomain) {
    baseFilter["OR"] = [{ shopDomain }, { shopDomain: null }];
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


