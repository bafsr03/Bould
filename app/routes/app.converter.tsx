import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  CalloutCard,
  InlineGrid,
  Box,
  Tabs,
  Link,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import DropZoneUploader from "./converterComponents/DropZoneUploader";
import ProductIndexTable from "./converterComponents/ProductIndexTable";
import LibraryTable from "./converterComponents/LibraryTable";
import AnalyticsSection from "./converterComponents/AnalyticsSection";
import TechnicalPackage from "./converterComponents/TechnicalPackage";
import Previewer from "./converterComponents/PreviewerPanel";
import ProductDetails from "./converterComponents/ProductDetails";

import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Product } from "../data";
import { products } from "../data";

type LoaderData = {
  products: Product[];
};

export const loader: LoaderFunction = async () => {
  return json<LoaderData>({ products });
};

export default function ConverterPage() {
  const { products } = useLoaderData<LoaderData>();
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback((tabIndex: number) => {
    setSelected(tabIndex);
  }, []);

  const tabsConfig = [
    { id: "converter", content: "Converter" },
    { id: "library", content: "Library" },
    { id: "analytics", content: "Analytics" },
  ];

  return (
    <Page>
      <TitleBar title="Bould" />

      <Layout>
        <Layout.Section>
          <Tabs tabs={tabsConfig} selected={selected} onSelect={handleTabChange} />

          {selected === 0 && (
            <>
              <Box >
                <CalloutCard
                  title="Watch the Steps to Convert any 2D image"
                  illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart.svg"
                  primaryAction={{ content: "Upload" }}
                  secondaryAction={{ content: "Watch Tutorial" }}
                >
                  <p>
                    To upload your design, drag and drop into the drop zone or click “Upload.”
                  </p>
                </CalloutCard>
              </Box>

              <Box paddingBlockStart="400">
                    <InlineGrid
                      columns={{
                        xs: "1fr",
                        sm: ["twoThirds", "oneThird"],
                      }}
                      gap="400"
                    >
                  <DropZoneUploader />
                  <ProductIndexTable products={products} />
                </InlineGrid>
              </Box>

              <Box paddingBlockStart="400">
                    <InlineGrid
                      columns={{
                        xs: "1fr",
                        sm: ["twoThirds", "oneThird"],
                      }}
                      gap="400"
                    >
                  <ProductDetails /* pass props if needed */ />
                  <Previewer /* pass props if needed */ />
                </InlineGrid>
              </Box>

              <Box paddingBlockStart="400">
                <TechnicalPackage /* pass props if needed */ />
              </Box>
            </>
          )}

          {selected === 1 && (
            <Box paddingBlockStart="400">
              <LibraryTable products={products} />
            </Box>
          )}

          {selected === 2 && (
            <Box >
              <AnalyticsSection  />
            </Box>
          )}
        </Layout.Section>
      </Layout>

      <Box padding="500">
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
  );
}
