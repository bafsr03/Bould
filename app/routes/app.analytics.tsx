import {
  Page,
  Layout,
  BlockStack,
  Box,
  Text,
  Card,
  InlineGrid,
  InlineStack,
  Button,
  Badge,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CalendarIcon } from "@shopify/polaris-icons";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

type MetricsWindow = {
  label: string;
  start: Date;
  end: Date;
};

type Point = { x: number; y: number };
type Series = { name: string; color: string; points: Point[] };

type AnalyticsData = {
  convertedTotal: number;
  convertedInWindow: number;
  widgetSessions: number;
  widgetUsers: number;
  widgetProducts: number;
  widgetCoverageRate: number;
  changeConvertedPct: number | null;
  changeWidgetSessionsPct: number | null;
  changeWidgetUsersPct: number | null;
  series: Series[];
  labels: string[];
  insights: string;
  lastUpdatedISO: string;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function calcChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return (current - previous) / previous;
}

function formatLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

type WidgetEventSample = {
  requestId: string | null;
  correlationId: string | null;
  shopifyProductId: string;
  createdAt: Date;
};

type SeriesInput = {
  window: MetricsWindow;
  conversions: Array<{ updatedAt: Date }>;
  widgetEvents: WidgetEventSample[];
};

function buildSeries({ window, conversions, widgetEvents }: SeriesInput): { series: Series[]; labels: string[] } {
  const days: Date[] = [];
  const { start } = window;
  for (let i = 0; i < 7; i += 1) {
    days.push(addDays(start, i));
  }

  const buckets = days.map((day) => ({
    start: startOfDay(day),
    end: addDays(startOfDay(day), 1),
  }));

  const convertedCounts = Array(days.length).fill(0);
  const sessionCounts = Array(days.length).fill(0);

  conversions.forEach((conv) => {
    const updated = new Date(conv.updatedAt);
    buckets.forEach((bucket, idx) => {
      if (updated >= bucket.start && updated < bucket.end) {
        convertedCounts[idx] += 1;
      }
    });
  });

  widgetEvents.forEach((event: WidgetEventSample) => {
    const created = new Date(event.createdAt);
    buckets.forEach((bucket, idx) => {
      if (created >= bucket.start && created < bucket.end) {
        sessionCounts[idx] += 1;
      }
    });
  });

  const labels = days.map((day) => formatLabel(day));

  const series: Series[] = [
    {
      name: "Converted Garments",
      color: "#108043",
      points: convertedCounts.map((count, idx) => ({ x: idx, y: count })),
    },
    {
      name: "Widget Sessions",
      color: "#1f73b7",
      points: sessionCounts.map((count, idx) => ({ x: idx, y: count })),
    },
  ];

  return { labels, series };
}

function uniqueUserCount(events: WidgetEventSample[]): number {
  const ids = new Set<string>();
  events.forEach((event: WidgetEventSample) => {
    let key = (event.correlationId || "").trim();
    if (!key) {
      key = (event.requestId || "").trim();
    }
    if (!key) {
      key = `${event.shopifyProductId}-${new Date(event.createdAt).toISOString()}`;
    }
    ids.add(key);
  });
  return ids.size;
}

type InsightsInput = {
  convertedTotal: number;
  convertedInWindow: number;
  widgetSessions: number;
  widgetUsers: number;
  widgetProducts: number;
  widgetCoverageRate: number;
};

async function generateInsights(input: InsightsInput): Promise<string> {
  const fallback = `${input.convertedInWindow} garments converted this week, ${input.widgetSessions} widget sessions across ${input.widgetProducts} garments (coverage ${(input.widgetCoverageRate * 100).toFixed(0)}%).`;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 160,
        messages: [
          {
            role: "system",
            content:
              "You are a fit analytics specialist. In under 80 words, compare garment conversions versus widget sessions, highlight adoption gaps, and suggest one next action to boost widget usage.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return (content || fallback).trim();
  } catch (error) {
    console.error("[ANALYTICS] Insight generation failed", error);
    return fallback;
  }
}

async function buildAnalyticsData(request: Request): Promise<AnalyticsData> {
  await authenticate.admin(request);

  const now = new Date();
  const window: MetricsWindow = {
    label: "Last 7 days",
    start: startOfDay(addDays(now, -6)),
    end: addDays(startOfDay(now), 1),
  };
  const prevWindow: MetricsWindow = {
    label: "Previous 7 days",
    start: startOfDay(addDays(now, -13)),
    end: startOfDay(addDays(now, -6)),
  };

  const [
    convertedInWindow,
    convertedPrev,
    convertedTotal,
    widgetEventsWindow,
    widgetEventsPrev,
    conversionsForSeries,
  ] = await Promise.all([
    prisma.conversion.count({
      where: {
        updatedAt: { gte: window.start, lt: window.end },
        processed: true,
        status: "completed",
      },
    }),
    prisma.conversion.count({
      where: {
        updatedAt: { gte: prevWindow.start, lt: prevWindow.end },
        processed: true,
        status: "completed",
      },
    }),
    prisma.conversion.count({ where: { processed: true, status: "completed" } }),
    (prisma as any).widgetEvent.findMany({
      where: {
        createdAt: { gte: window.start, lt: window.end },
        conversion: { processed: true, status: "completed" },
      },
      select: { requestId: true, correlationId: true, shopifyProductId: true, createdAt: true },
    }),
    (prisma as any).widgetEvent.findMany({
      where: {
        createdAt: { gte: prevWindow.start, lt: prevWindow.end },
        conversion: { processed: true, status: "completed" },
      },
      select: { requestId: true, correlationId: true, shopifyProductId: true, createdAt: true },
    }),
    prisma.conversion.findMany({
      where: {
        processed: true,
        status: "completed",
        updatedAt: { gte: window.start, lt: window.end },
      },
      select: { updatedAt: true },
    }),
  ]);

  const widgetSessions = widgetEventsWindow.length;
  const widgetUsers = uniqueUserCount(widgetEventsWindow);
  const widgetUsersPrev = uniqueUserCount(widgetEventsPrev);
  const widgetProducts = new Set(widgetEventsWindow.map((event: WidgetEventSample) => event.shopifyProductId)).size;
  const widgetSessionsPrev = widgetEventsPrev.length;

  const widgetCoverageRate = convertedTotal > 0 ? widgetProducts / convertedTotal : 0;

  const { labels, series } = buildSeries({ window, conversions: conversionsForSeries, widgetEvents: widgetEventsWindow });

  const insights = await generateInsights({
    convertedTotal,
    convertedInWindow,
    widgetSessions,
    widgetUsers,
    widgetProducts,
    widgetCoverageRate,
  });

  return {
    convertedTotal,
    convertedInWindow,
    widgetSessions,
    widgetUsers,
    widgetProducts,
    widgetCoverageRate,
    changeConvertedPct: calcChange(convertedInWindow, convertedPrev),
    changeWidgetSessionsPct: calcChange(widgetSessions, widgetSessionsPrev),
    changeWidgetUsersPct: calcChange(widgetUsers, widgetUsersPrev),
    series,
    labels,
    insights,
    lastUpdatedISO: now.toISOString(),
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const data = await buildAnalyticsData(request);
  return json(data);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await buildAnalyticsData(request);
  return json(data);
};

function TrendStat({ label, value, change }: { label: string; value: string; change: number | null }) {
  const tone: "success" | "critical" | "subdued" =
    change === null ? "subdued" : change > 0 ? "success" : change < 0 ? "critical" : "subdued";
  const arrow = change === null ? "→" : change > 0 ? "↑" : change < 0 ? "↓" : "→";
  const displayChange = change === null ? "–" : `${Math.round(Math.abs(change) * 100)}%`;
  return (
    <BlockStack gap="050">
      <Text as="span" tone="subdued">{label}</Text>
      <InlineStack gap="200" blockAlign="center">
        <Text variant="headingLg" as="h3">{value}</Text>
        <Text as="span" tone={tone}>{arrow} {displayChange}</Text>
      </InlineStack>
    </BlockStack>
  );
}

function LineChart({ series, labels }: { series: Series[]; labels: string[] }) {
  const width = 820;
  const height = 220;
  const padding = 32;
  const maxY = Math.max(
    1,
    ...series.flatMap((s) => s.points.map((p) => p.y))
  );
  const scaleX = (x: number) => padding + (x * (width - padding * 2)) / (labels.length - 1);
  const scaleY = (y: number) => height - padding - (y * (height - padding * 2)) / maxY;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Conversion trend chart">
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E1E3E5" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#E1E3E5" />
      {/* Series */}
      {series.map((s, idx) => {
        const d = s.points
          .map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p.x)},${scaleY(p.y)}`)
          .join(" ");
        return <path key={idx} d={d} fill="none" stroke={s.color} strokeWidth={2} />;
      })}
      {/* Labels */}
      {labels.map((lab, i) => (
        <text key={i} x={scaleX(i)} y={height - padding + 16} fontSize="11" textAnchor="middle" fill="#6D7175">
          {lab}
        </text>
      ))}
    </svg>
  );
}

export default function AnalyticsPage() {
  const initialData = useLoaderData<AnalyticsData>();
  const fetcher = useFetcher<AnalyticsData>();
  const [analytics, setAnalytics] = useState(initialData);

  useEffect(() => {
    if (fetcher.data) {
      setAnalytics(fetcher.data);
    }
  }, [fetcher.data]);

  const refreshing = fetcher.state !== "idle";

  const handleRefresh = useCallback(() => {
    const formData = new FormData();
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  const coverageBadgeTone = useMemo(() => {
    if (analytics.widgetCoverageRate >= 0.8) return "success";
    if (analytics.widgetCoverageRate >= 0.5) return "attention";
    return "critical";
  }, [analytics.widgetCoverageRate]);

  const legendToneFor = useCallback((name: string): "success" | "attention" | "info" => {
    if (name === "Converted Garments") return "success";
    if (name === "Widget Sessions") return "attention";
    return "info";
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    try {
      return new Date(analytics.lastUpdatedISO).toLocaleString();
    } catch (error) {
      return analytics.lastUpdatedISO;
    }
  }, [analytics.lastUpdatedISO]);

  return (
    <Page>
      <TitleBar title="Bould" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <InlineStack gap="200">
              <Button icon={CalendarIcon} variant="secondary">Last 7 days</Button>
              <Button variant="primary" onClick={handleRefresh} loading={refreshing}>
                Update
              </Button>
            </InlineStack>

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">Conversions vs Widget Usage</Text>
                  <Box paddingBlockStart="300">
                    <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                      <TrendStat label="Converted Garments" value={String(analytics.convertedInWindow)} change={analytics.changeConvertedPct} />
                      <TrendStat label="Widget Sessions" value={String(analytics.widgetSessions)} change={analytics.changeWidgetSessionsPct} />
                      <TrendStat label="Widget Users" value={String(analytics.widgetUsers)} change={analytics.changeWidgetUsersPct} />
                    </InlineGrid>
                  </Box>
                  <Box paddingBlockStart="400">
                    <LineChart series={analytics.series} labels={analytics.labels} />
                    <InlineStack gap="300" align="center">
                      {analytics.series.map((seriesItem) => (
                        <Badge key={seriesItem.name} tone={legendToneFor(seriesItem.name)}>{seriesItem.name}</Badge>
                      ))}
                    </InlineStack>
                  </Box>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">Insights</Text>
                  <Box paddingBlockStart="200">
                    <Badge tone={coverageBadgeTone}>{`Widget coverage ${Math.round(analytics.widgetCoverageRate * 100)}%`}</Badge>
                  </Box>
                  <Divider />
                  <Box paddingBlockStart="300">
                    <BlockStack gap="200">
                      <Text as="p">{analytics.insights}</Text>
                      <Text as="p" tone="subdued">
                        {analytics.widgetSessions} sessions · {analytics.widgetUsers} users · {analytics.widgetProducts} garments engaged
                      </Text>
                      <Text as="p" tone="subdued">
                        Total converted garments: {analytics.convertedTotal}
                      </Text>
                      <Text as="p" tone="subdued">Last updated: {lastUpdatedLabel}</Text>
                    </BlockStack>
                  </Box>
                </Box>
              </Card>
            </InlineGrid>

            <Box paddingBlockStart="300">
              <div style={{ textAlign: "center" }}>
                <Text as="h4" tone="subdued">
                  Need help? <a href="mailto:jake@bouldhq.com">Chat with us.</a>
                </Text>
                <Box paddingBlockStart="100">
                  <Text as="h4" tone="subdued">© 2025 Bould</Text>
                </Box>
              </div>
            </Box>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}


