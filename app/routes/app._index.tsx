
import {
  Page,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  Link,
  InlineStack,
  Banner,
  Select,
  Icon,
  Badge,
  InlineGrid,
  ButtonGroup,
  Layout,
} from "@shopify/polaris";
import {
  CalendarIcon,
  PlayCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatIcon,
  EnvelopeSoftPackIcon,
} from "@shopify/polaris-icons";
import { Link as RemixLink, useLoaderData } from "@remix-run/react";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { type BillingPlanId } from "../billing/plans";
import { getPlanForShop } from "../billing/plan.server";
import {
  getApparelPreviewUsage,
  isApparelPreviewLimitExceeded,
} from "../billing/usage.server";

type LoaderData = {
  usage: {
    garmentsConverted: number;
    apparelPreviews: number;
    stickersGenerated: number;
  };
  plan: {
    id: BillingPlanId;
    name: string;
    analyticsAccess: boolean;
    apparelPreviewLimit: number | null;
    apparelPreviewLimitExceeded: boolean;
  };
};

const numberFormatter = new Intl.NumberFormat("en-US");

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const meta: MetaFunction = () => ([
  { title: "Welcome to Bould | Pioneering the Future of Online Shopping" },
  { name: "description", content: "Convert 2D designs into interactive 3D product renders, preview blank apparel, and generate custom stickers with printed samples,  all in our Shopify app." }
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shopDomain = session?.shop ?? null;

  const now = new Date();
  const windowStart = startOfDay(addDays(now, -6));
  const windowEnd = addDays(startOfDay(now), 1);

  let garmentsConverted = 0;

  try {
    const conversionWhere: Record<string, unknown> = {
      processed: true,
      status: "completed",
      updatedAt: { gte: windowStart, lt: windowEnd },
    };

    if (shopDomain) {
      conversionWhere["OR"] = [{ shopDomain }, { shopDomain: null }];
    }

    garmentsConverted = await (prisma as any).conversion.count({
      where: conversionWhere,
    });
  } catch (error) {
    console.error("[HOME] Failed to load usage summary", error);
  }

  const planContext = await getPlanForShop({ billing, shopDomain });
  const apparelUsage = await getApparelPreviewUsage(shopDomain);
  const apparelLimitExceeded = isApparelPreviewLimitExceeded(
    planContext.plan,
    apparelUsage
  );

  return json<LoaderData>({
    usage: {
      garmentsConverted,
      apparelPreviews: apparelUsage.total,
      stickersGenerated: 0,
    },
    plan: {
      id: planContext.planId,
      name: planContext.plan.name,
      analyticsAccess: planContext.plan.capabilities.analyticsAccess,
      apparelPreviewLimit:
        planContext.plan.capabilities.apparelPreviewLimit ?? null,
      apparelPreviewLimitExceeded: apparelLimitExceeded,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product { id, title, handle, status }
        }
      }`,
    { variables: { product: { title: `${color} Snowboard` } } }
  );
  const responseJson = await response.json();
  return { product: responseJson.data!.productCreate!.product };
};

export default function Index() {
  const { usage, plan } = useLoaderData<typeof loader>();
  const formatMetric = (value: number | null | undefined) =>
    value == null ? "-" : numberFormatter.format(value);

  const handleDismiss = () => console.log("Banner dismissed");
  const handleSelectChange = (value: string) => console.log("Select changed to:", value);

  const planBadgeTone =
    plan.id === "starter" ? "success" : plan.id === "creator" ? "info" : "primary";

  return (
    <Page>
      <BlockStack gap="500">
        {/* Section 1 */}
        <Box paddingBlockEnd="100">
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <Text variant="headingXl" as="h1">
             Welcome to Bould | Pioneering the Future of Online Shopping
            </Text>
            <Badge tone={planBadgeTone}>{plan.name} plan</Badge>
          </InlineStack>
        </Box>

        {plan.apparelPreviewLimitExceeded && (
          <Banner tone="critical" title="Upgrade required">
            <p>
              You have exceeded the Starter plan&apos;s apparel preview limit. All garments are
              paused until you upgrade your plan.
            </p>
            <Link url="/app/pricing">Choose a plan</Link>
          </Banner>
        )}

        {/* Section 2 */}
        <Banner onDismiss={handleDismiss}>
          <Text as="p">
            "We're in beta testing now. Share your live feedback today!"{" "}
            <Link url="#">Contact us</Link>.
          </Text>
        </Banner>

        {/* Section 3 */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          <Card>
            <BlockStack gap="300">
              <Box padding="200">
                <img
                  src="https://i.imgur.com/mgM7N5U.png"
                  alt="2D to 3D product converter icon"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </Box>
              <Text variant="headingMd" as="h3">
                Convert my garments
              </Text>
              <Text as="p" tone="subdued">
                Upload your designs to create renders, ready for customers to view.
              </Text>
              <RemixLink to="/app/converter" style={{ textDecoration: "none", width: "100%" }}>
                <Button fullWidth variant="primary">
                  Start Conversion
                </Button>
              </RemixLink>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Box padding="200">
                <img
                  src="https://i.imgur.com/niDGK6u.png"
                  alt="Blank apparel preview tool icon"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </Box>
              <Text variant="headingMd" as="h3">
                Blank Apparel Preview
              </Text>
              <Text as="p" tone="subdued">
                Preview and customize blank apparel designs with Beta samples.
              </Text>
              <RemixLink to="/app/blanks" style={{ textDecoration: "none", width: "100%" }}>
                <Button fullWidth variant="primary" disabled>
                  Coming soon
                </Button>
              </RemixLink>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Box padding="200">
                <img
                  src="https://i.imgur.com/UqXBfig.png"
                  alt="Sticker maker and printer icon"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </Box>
              <Text variant="headingMd" as="h3">
                Sticker Maker & Printer
              </Text>
              <Text as="p" tone="subdued">
                Design custom stickers using our image generator engine (coming soon).
              </Text>
              <RemixLink to="/app/stickers" style={{ textDecoration: "none", width: "100%" }}>
                <Button fullWidth variant="primary" disabled>
                  Coming soon
                </Button>
              </RemixLink>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Section 4 */}
        <Box paddingBlockStart="200" paddingBlockEnd="200">
          <InlineStack align="space-between" blockAlign="center" gap="400">
            <InlineStack gap="200" blockAlign="center">
              <Text as="p">Choose app language:</Text>
              <Select
                label="Select app language"
                labelHidden
                options={[{ label: "English", value: "en" }]}
                value="en"
                onChange={handleSelectChange}
              />
            </InlineStack>
            <Button icon={CalendarIcon}>Past 7 days</Button>
          </InlineStack>
        </Box>

 
        {/* Section 5: Usage Summary */}
        <Card>
          <Box padding="600">
            <InlineStack align="center" gap="400">
              <BlockStack gap="100" inlineAlign="center">
          <Text as="p" tone="subdued">Garments Converted</Text>
          <Text variant="headingLg" as="h2">{formatMetric(usage.garmentsConverted)}</Text>
              </BlockStack>
              <BlockStack gap="100" inlineAlign="center">
          <Text as="p" tone="subdued">Apparel Previews</Text>
          <Text variant="headingLg" as="h2">
            {formatMetric(usage.apparelPreviews)}
          </Text>
          {plan.apparelPreviewLimit && (
            <Text as="p" tone={plan.apparelPreviewLimitExceeded ? "critical" : "subdued"}>
              {usage.apparelPreviews}/{plan.apparelPreviewLimit} previews used
            </Text>
          )}
              </BlockStack>
              <BlockStack gap="100" inlineAlign="center">
          <Text as="p" tone="subdued">Stickers Generated</Text>
          <Text variant="headingLg" as="h2">{formatMetric(usage.stickersGenerated)}</Text>
              </BlockStack>
            </InlineStack>
          </Box>
        </Card>

        {/* Section 7 */}
        <BlockStack gap="300">
          <Text variant="headingMd" as="h2">
            Quick tutorials
          </Text>
          <Layout>
            <Layout.Section>
              <Card>
                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <Box
                    background="bg-surface-secondary"
                    minWidth="80px"
                    minHeight="60px"
                    borderRadius="200"
                  >
                    <Icon
                      source={PlayCircleIcon}
                      tone="base"
                      accessibilityLabel="Tutorial video"
                    />
                  </Box>
                  <BlockStack gap="150">
                    <Text as="p" fontWeight="semibold">
                      How to convert my products ?
                    </Text>
                    <Text as="p" tone="subdued">
                      Configure your products in our converter page, by uploading your product images and stock.
                    </Text>
                    <InlineStack gap="200" wrap={false}>
                      <Button
                        icon={PlayCircleIcon}
                        variant="plain"
                        accessibilityLabel="Watch video"
                      >
                        Watch video
                      </Button>
                      <Link url="#" removeUnderline>
                        Read instruction
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </InlineStack>
              </Card>
            </Layout.Section>
            <Layout.Section>
              <Card>
                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <Box
                    background="bg-surface-secondary"
                    minWidth="80px"
                    minHeight="60px"
                    borderRadius="200"
                  >
                    <Icon
                      source={CalendarIcon}
                      tone="base"
                      accessibilityLabel="Preview tutorial"
                    />
                  </Box>
                  <BlockStack gap="150">
                    <Text as="p" fontWeight="semibold">
                      How to preview my product designs live in-store?
                    </Text>
                    <Text as="p" tone="subdued">
                      Highlight your apparel options and review fits with try-on feature.
                    </Text>
                    <InlineStack gap="200" wrap={false}>
                      <Button
                        icon={PlayCircleIcon}
                        variant="plain"
                        accessibilityLabel="Watch video"
                      >
                        Watch video
                      </Button>
                      <Link url="#" removeUnderline>
                        Read instruction
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </InlineStack>
              </Card>
            </Layout.Section>
          </Layout>
          <InlineStack align="center">
            <ButtonGroup>
              <Button icon={ChevronLeftIcon} accessibilityLabel="Previous tutorial" />
              <Box paddingInlineStart="150" paddingInlineEnd="150">
                <Text as="p">1/1</Text>
              </Box>
              <Button icon={ChevronRightIcon} accessibilityLabel="Next tutorial" />
            </ButtonGroup>
          </InlineStack>
        </BlockStack>

        {/* Section 8 */}
        <BlockStack gap="300">
          <Text variant="headingMd" as="h2">
            Need any help?
          </Text>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            <Card>
              <BlockStack gap="150" inlineAlign="center">
                <Icon source={ChatIcon} tone="primary" />
                <Link url="#" removeUnderline>
                  <Text variant="headingSm" as="h4">
                    Get email support
                  </Text>
                </Link>
                <Text as="p" tone="subdued" alignment="center">
                  Email us and we'll get back to you as soon as possible.
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="150" inlineAlign="center">
                <Icon source={EnvelopeSoftPackIcon} tone="primary" />
                <Link url="#" removeUnderline>
                  <Text variant="headingSm" as="h4">
                    Contact us
                  </Text>
                </Link>
                <Text as="p" tone="subdued" alignment="center">
                  Contact us to get help with your question.
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="150" inlineAlign="center">
                <Icon source={EnvelopeSoftPackIcon} tone="primary" />
                <Link url="#" removeUnderline>
                  <Text variant="headingSm" as="h4">
                    Help docs
                  </Text>
                </Link>
                <Text as="p" tone="subdued" alignment="center">
                  Find a solution for your problem with documents (coming soon)
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </BlockStack>

        {/* Footer */}
        <Box padding="1000">
          <div style={{ textAlign: "center" }}>
            <Text as="h4" tone="subdued">
              Need help?{" "}
              <Link url="mailto:jake@bouldhq.com" removeUnderline>
                Chat with us.
              </Link>
            </Text>
            <Box paddingBlockStart="100">
              <Text as="h4" tone="subdued">
                © 2025 Bould
              </Text>
            </Box>
          </div>
        </Box>
      </BlockStack>
    </Page>
  );
}
