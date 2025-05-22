import React from "react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";

export default function PricingPage() {
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
                  100,000{" "}
                  <Text as="span" tone="subdued">
                    unique visitors / 30 days
                  </Text>
                </Text>
                <Text as="p" tone="subdued">
                  If you exceed your limit, Bould will pause your free plan
                </Text>
                <Box
                  background="bg-surface-secondary"
                  padding="200"
                  borderRadius="200"
                  borderColor="border"
                  borderWidth="050"
                >
                  <Text tone="subdued" as="h4">
                    You've had 0 unique visitors in the last day (equivalent to
                    0 over 30 days).
                  </Text>
                </Box>
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
                  {plans.map((plan) => (
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
                              {plan.recommended && (
                                <Badge tone="info">Recommended</Badge>
                              )}
                            </InlineStack>

                            <Text as="h2" variant="headingLg">
                              {plan.price}
                              <Text as="span" variant="bodyMd" tone="subdued">
                                {" "}
                                / month
                              </Text>
                            </Text>

                            {plan.trial && (
                              <Text variant="bodySm" tone="subdued" as="h4">
                                {plan.trial}
                              </Text>
                            )}

                            <BlockStack gap="100">
                              {plan.features.map((feature, idx) => (
                                <InlineStack
                                  key={idx}
                                  align="start"
                                  blockAlign="center"
                                  gap="100"
                                >
                                  <Box minWidth="20px">
                                    <Icon source={CheckIcon} tone="success" />
                                  </Box>
                                  <Text as="h4">{feature}</Text>
                                </InlineStack>
                              ))}
                            </BlockStack>
                          </BlockStack>
                        </BlockStack>

                        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                          <Divider />
                          <Box paddingBlockStart="100">
                            <Button variant="primary" fullWidth>
                              {plan.cta}
                            </Button>
                          </Box>
                        </div>
                      </div>
                    </Box>
                  ))}
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

const plans = [
  {
    name: "Starter",
    price: "Free",
    trial: "14-day free trial (13 days remaining)",
    features: [
      "Limited AI sticker usage",
      "Access to limited Try-On ",
      "AR Try-On included (5 models/month)",
    ],
    cta: "Choose plan",
    recommended: false,
  },
  {
    name: "Creator",
    price: "$20",
    trial: "14-day free trial (13 days remaining)",
    features: [
      "Unlimited AI sticker generation",
      "Full access to Blanks Design Lab",
      "Standard creator support",
      "AR Try-On included (50 models/month)",
    ],
    cta: "Choose plan",
    recommended: false,
  },
  {
    name: "Pro",
    price: "$50",
    trial: "30-day free trial (29 days remaining)",
    features: [
      "AR Try-On included (unlimmited models)",
      "Unlimited Blanks + Stickers",
      "Priority support & asset delivery",
      "35% off on all blanks and stickers",
    ],
    cta: "Choose plan",
    recommended: true,
  },
];
