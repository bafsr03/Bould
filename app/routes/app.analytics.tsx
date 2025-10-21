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
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

type Point = { x: number; y: number };
type Series = { name: string; color: string; points: Point[] };

type AnalyticsData = {
  started: number;
  completed: number;
  successRate: number; // 0..1
  changeStartedPct: number;
  changeCompletedPct: number;
  changeSuccessPct: number;
  series: Series[];
  labels: string[]; // x labels
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Placeholder analytics until wired to your DB/services
  const labels = ["Jan 5", "Jan 10", "Jan 15", "Jan 20", "Jan 25", "Jan 30", "Feb 1"];
  const startedSeries: Series = {
    name: "Started",
    color: "#1f73b7",
    points: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 1 },
      { x: 4, y: 5 },
      { x: 5, y: 1 },
      { x: 6, y: 1 },
    ],
  };
  const completedSeries: Series = {
    name: "Completed",
    color: "#108043",
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: 0 },
      { x: 4, y: 3 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ],
  };
  const failedSeries: Series = {
    name: "Failed",
    color: "#de3618",
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 1 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ],
  };

  const started = 11;
  const completed = 7;
  const successRate = completed / started; // 0.64

  const data: AnalyticsData = {
    started,
    completed,
    successRate,
    changeStartedPct: -0.22,
    changeCompletedPct: 0.18,
    changeSuccessPct: 0.07,
    series: [startedSeries, completedSeries, failedSeries],
    labels,
  };

  return json(data);
};

function TrendStat({ label, value, change }: { label: string; value: string; change: number }) {
  const tone = change > 0 ? "success" : change < 0 ? "critical" : "subdued";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  return (
    <BlockStack gap="050">
      <Text tone="subdued">{label}</Text>
      <InlineStack gap="200" blockAlign="center">
        <Text variant="headingLg" as="h3">{value}</Text>
        <Text tone={tone as any}>{arrow} {Math.round(Math.abs(change) * 100)}%</Text>
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
  const data = useLoaderData<AnalyticsData>();

  return (
    <Page>
      <TitleBar title="Bould" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <InlineStack gap="200">
              <Button icon={CalendarIcon} variant="secondary">01/01/2025 - 02/21/2025</Button>
              <Button variant="secondary">Compare: Previous period</Button>
            </InlineStack>

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">Conversion Trend</Text>
                  <Box paddingBlockStart="300">
                    <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                      <TrendStat label="Conversions Started" value={String(data.started)} change={data.changeStartedPct} />
                      <TrendStat label="Conversions Completed" value={String(data.completed)} change={data.changeCompletedPct} />
                      <TrendStat label="Success Rate" value={`${Math.round(data.successRate * 100)}%`} change={data.changeSuccessPct} />
                    </InlineGrid>
                  </Box>
                  <Box paddingBlockStart="400">
                    <LineChart series={data.series} labels={data.labels} />
                    <InlineStack gap="300" align="center">
                      <Badge tone="attention">Started</Badge>
                      <Badge tone="success">Completed</Badge>
                      <Badge tone="critical">Failed</Badge>
                    </InlineStack>
                  </Box>
                </Box>
              </Card>

              <Card>
                <Box padding="400">
                  <Text variant="headingMd" as="h3">Insights</Text>
                  <Box paddingBlockStart="200">
                    <Badge tone="success">Success Rate {Math.round(data.successRate * 100)}%</Badge>
                  </Box>
                  <Divider />
                  <Box paddingBlockStart="300">
                    <BlockStack gap="200">
                      <Text as="p">• Placeholder insights powered by LLM will appear here.</Text>
                      <Text as="p" tone="subdued">• We will analyze conversion spikes, failures, and processing times using your OpenAI API key.</Text>
                      <Text as="p" tone="subdued">• This is front‑end only; wiring to the analysis service will be added later.</Text>
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


