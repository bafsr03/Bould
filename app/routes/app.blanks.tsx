import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Banner,
  Badge,
  Grid,
  Text,
  Box,
  Link,
} from "@shopify/polaris";
import MediaSection from "./blanksComponents/MediaSection";
import SalesCard from "./blanksComponents/OrderCard";
import OrdersCard from "./blanksComponents/PaymentCard";
import type { Order } from "./blanksComponents/OrdersSection";
import OrderSection from "./blanksComponents/OrdersSection";

const mediaImages = [
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
];

// Sample orders for demo—swap in your real data
const sampleOrders: Order[] = [
  {
    id: "001",
    order: (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        #001
      </Text>
    ),
    date: "Jul 20 at 4:34pm",
    blanks: "Bould hoodie",
    total: "$969.44",
    paymentStatus: <Badge progress="complete">Paid</Badge>,
    fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
  },
  {
    id: "019",
    order: (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        #019
      </Text>
    ),
    date: "Jul 29 at 3:46pm",
    blanks: "Cargo Pants",
    total: "$701.19",
    paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
    fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
  },
  {
    id: "040",
    order: (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        #040
      </Text>
    ),
    date: "sept 13 at 3:44pm",
    blanks: "5 Panel cap",
    total: "$798.24",
    paymentStatus: <Badge progress="complete">Paid</Badge>,
    fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
  },
];

export default function BlanksPage() {
  const [category, setCategory] = useState("T-shirts");
  const handleCategory = useCallback(
    (cat: React.SetStateAction<string>) => setCategory(cat),
    [],
  );

  return (
    <>
      {/* — Blanks header only — */}
      <Page titleHidden>
        <Text variant="headingXl" as="h1">
          Blanks
        </Text>
        <Layout>
          <Layout.Section>
            <Banner title="Experimental mode" onDismiss={() => {}}>
              <p>
                Blanks is still in Beta testing; you can still view our extended
                catalog below.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>

      {/* — Product detail page — */}
      <Page
        backAction={{ content: "Products", url: "#" }}
        title="Bould Blanks T-shirt"
        titleMetadata={<Badge tone="info">Draft</Badge>}
        subtitle="Perfect for anyone any size."
        compactTitle
        pagination={{ hasPrevious: true, hasNext: true }}
        primaryAction={{
          content: "View on converter",
          disabled: true,
        }}
        actionGroups={[
          {
            title: `Category: ${category}`,
            actions: [
              {
                content: "T-shirts",
                onAction: () => handleCategory("T-shirts"),
              },
              { content: "Pants", onAction: () => handleCategory("Pants") },
              { content: "Hoodies", onAction: () => handleCategory("Hoodies") },
              { content: "Shorts", onAction: () => handleCategory("Shorts") },
              { content: "Hats", onAction: () => handleCategory("Hats") },
            ],
          },
        ]}
      >
        <Layout>
          {/* Media gallery card */}
          <Layout.Section>
            <MediaSection images={mediaImages} />
          </Layout.Section>

          {/* Sales & Orders cards */}
          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <SalesCard />
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <OrdersCard />
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          {/* ← New: Orders table section */}
          <Layout.Section>
            <OrderSection orders={sampleOrders} />
          </Layout.Section>
        </Layout>
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
      </Page>
    </>
  );
}
