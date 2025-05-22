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
import TechnicalPackages from "./blanksComponents/TechnicalPackage";


const mediaImages = [
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
  "https://i.imgur.com/mW4frY9.jpeg",
];

export default function BlanksPage() {
  const [category, setCategory] = useState("T-shirts");
  const handleCategory = useCallback(
    (cat: React.SetStateAction<string>) => setCategory(cat),
    [],
  );

  // CSS to make LegacyCard stretch to the height of its wrapper
  const stretchStyles = `
    .equal-height-card-wrapper > .Polaris-LegacyCard {
      height: 100%;
    }
  `;

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

      {/* Inject styles for equal height cards */}
      <style>{stretchStyles}</style>

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
                <div style={{ height: '100%' }} className="equal-height-card-wrapper">
                  <TechnicalPackages  />
                </div>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <div style={{ height: '100%' }} className="equal-height-card-wrapper">
                  <SalesCard />
                </div>
              </Grid.Cell>
            </Grid>
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