import {
  Page,
  Layout,
  BlockStack,
  Box,
  Text,
  InlineGrid,
  Button,
  Divider,
  InlineStack,
  Link,
  Icon,
  Badge,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  APP_PLANS,
  type BillingPlanId,
} from "../billing/plans";
import { authenticate } from "../shopify.server";
import { getPlanForShop } from "../billing/plan.server";
import {
  getApparelPreviewUsage,
  isApparelPreviewLimitExceeded,
} from "../billing/usage.server";

const numberFormatter = new Intl.NumberFormat("en-US");

type LoaderData = {
  activePlanId: BillingPlanId;
  planName: string;
  apparelPreviewLimit: number | null;
  apparelPreviewLimitExceeded: boolean;
  apparelPreviewsUsed: number;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shopDomain = session?.shop ?? null;

  const planContext = await getPlanForShop({ billing, shopDomain });
  const usage = await getApparelPreviewUsage(shopDomain, {
    windowMinutes: planContext.plan.capabilities.apparelPreviewResetMinutes ?? undefined,
  });
  const apparelLimitExceeded = isApparelPreviewLimitExceeded(
    planContext.plan,
    usage
  );

  return json<LoaderData>({
    activePlanId: planContext.planId,
    planName: planContext.plan.name,
    apparelPreviewLimit: planContext.plan.capabilities.apparelPreviewLimit ?? null,
    apparelPreviewLimitExceeded: apparelLimitExceeded,
    apparelPreviewsUsed: usage.total,
  });
};

export default function PricingPage() {
  const {
    activePlanId,
    apparelPreviewLimit,
    apparelPreviewLimitExceeded,
    apparelPreviewsUsed,
  } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const formattedApparelPreviews = numberFormatter.format(apparelPreviewsUsed);

  const statusBanner =
    status === "upgraded" ? (
      <Banner tone="success" onDismiss={() => {}}>
        <p>
          Thanks! Shopify is opening to confirm your purchase. You&apos;ll land back here when the
          upgrade is complete.
        </p>
      </Banner>
    ) : status === "starter" ? (
      <Banner tone="info" onDismiss={() => {}}>
        <p>Your paid subscription has been cancelled. You&apos;re now on the Starter plan.</p>
      </Banner>
    ) : status === "analytics-upgrade" ? (
      <Banner tone="warning" onDismiss={() => {}}>
        <p>Analytics are available on Creator and Pro plans. Upgrade to unlock advanced reporting.</p>
      </Banner>
    ) : null;

  const overageBanner =
    apparelPreviewLimitExceeded && apparelPreviewLimit ? (
      <Banner tone="critical" onDismiss={() => {}}>
        <p>
          You&apos;ve reached the Starter plan limit of {apparelPreviewLimit} apparel previews. Garments are paused in the widget until you upgrade.
        </p>
      </Banner>
    ) : null;

  return (
    <Page>
      <TitleBar title="Bould" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            {/* Monthly Visitors Title */}
            <Box>
              <Text variant="headingXl" as="h1">
                Pricing
              </Text>
            </Box>

            {/* Monthly Visitors Box */}
            <Box background="bg-surface" padding="300" borderRadius="300">
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">
                  Number of monthly visitors
                </Text>
                <Text variant="bodyLg" as="p" fontWeight="medium">
                  {formattedApparelPreviews}{" "}
                  <Text as="span" tone="subdued">
                    shoppers have used your widget so far
                  </Text>
                </Text>
                <Text as="p" tone="subdued">
                  Stay within your plan limit to keep the widget active for shoppers.
                </Text>
                {overageBanner}
                {statusBanner}
              </BlockStack>
            </Box>

            {/* Plan Selection Box */}
            <Box background="bg-surface" padding="300" borderRadius="300">
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">
                  Pick the right plan
                </Text>
                <Text as="h4">
                  Questions?{" "}
                  <Link url="mailto:support@bould.ai">Chat with us.</Link>
                </Text>


                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="300">
                  {APP_PLANS.map((plan) => {
                    const isActivePlan = plan.id === activePlanId;
                    return (
                    <Box
                      key={plan.name}
                      background="bg-surface-secondary"
                      padding="300"
                      borderRadius="300"
                      minHeight="100%"
                      borderColor="border"
                      borderWidth="050"
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <BlockStack gap="200">
                          <BlockStack gap="100">
                            <InlineStack
                              align="space-between"
                              blockAlign="center"
                            >
                              <Text variant="headingSm" as="h3">
                                {plan.name}
                              </Text>
                              <InlineStack gap="100">
                                {isActivePlan && (
                                  <Badge tone="success">Current plan</Badge>
                                )}
                              {plan.recommended && (
                                <Badge tone="info">Recommended</Badge>
                              )}
                              </InlineStack>
                            </InlineStack>

                            <Text as="h2" variant="headingLg">
                              {plan.priceLabel}
                              <Text as="span" variant="bodyMd" tone="subdued">
                                {" "}
                                / month
                              </Text>
                            </Text>

                            <BlockStack gap="100">
                              {plan.features.map((feature, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "min-content 1fr",
                                    columnGap: "var(--p-space-100)",
                                    alignItems: "start",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      justifyContent: "center",
                                      width: "20px",
                                    }}
                                  >
                                    <Icon source={CheckIcon} tone="success" />
                                  </div>
                                  <div style={{ wordBreak: "break-word" }}>
                                    <Text as="h4">{feature}</Text>
                                  </div>
                                </div>
                              ))}
                            </BlockStack>
                          </BlockStack>
                        </BlockStack>

                        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                          <Divider />
                          <Box paddingBlockStart="100">
                            <Form method="post" action="/app/upgrade">
                              <input type="hidden" name="plan" value={plan.id} />
                              <Button
                                variant="primary"
                                fullWidth
                                submit
                                disabled={isActivePlan}
                              >
                                {isActivePlan ? "Current plan" : plan.cta}
                            </Button>
                            </Form>
                          </Box>
                        </div>
                      </div>
                    </Box>
                    );
                  })}
                </InlineGrid>
              </BlockStack>
            </Box>

            {/* Enterprise Box */}
            <Box
              background="bg-surface"
              padding="300"
              borderRadius="300"
              borderColor="border"
              borderWidth="050"
            >
              <BlockStack gap="400">
                <InlineGrid columns="1fr auto" gap="100">
                  <Text as="h2" variant="headingXl">
                    Enterprise
                  </Text>
                  <Button
                    onClick={() => {}}
                    accessibilityLabel="Contact Sales"
                    variant="primary"
                  >
                    Contact Sales
                  </Button>
                </InlineGrid>
                <Text as="p" variant="bodyMd">
                  Let's find a plan that works for your business
                </Text>
              </BlockStack>
            </Box>

            {/* Footer */}
            <Box paddingBlockStart="300">
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
        </Layout.Section>
      </Layout>
    </Page>
  );
}