// src/pages/ConverterPage.tsx
import React from "react";
import {
  Layout,
  Page,
  Text,
  CalloutCard,
  InlineGrid,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import DropZoneUploader from "./converterComponents/DropZoneUploader";
import ProductIndexTable from "./converterComponents/ProductIndexTable";
import TechnicalPackage from "./converterComponents/TechnicalPackage";
import Previewer from "./converterComponents/PreviewerPanel";
import ProductDetails from "./converterComponents/ProductDetails";

export default function ConverterPage() {
  return (
    <Page>
      <TitleBar title="Bould" />
      <Layout>
        <Layout.Section>
          <Text variant="headingXl" as="h1">
            Converter
          </Text>

          <CalloutCard
            title="Watch the Steps to Convert any 2D image"
            illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
            primaryAction={{ content: "Upload" }}
            secondaryAction={{ content: "Watch Tutorial" }}
          >
            <p>
              To upload your Garment to the Converter, drag and drop your Design in the drop zone, or click on upload.
            </p>
          </CalloutCard>

          <Box paddingBlockStart="400">
            <InlineGrid
              columns={{
                xs: "1fr",
                sm: ["twoThirds", "oneThird"],
              }}
              gap="400"
            >
              <DropZoneUploader />
              <ProductIndexTable />
            </InlineGrid>
          </Box>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={{ xs: "1fr", sm: ["oneThird", "twoThirds"] }} gap="400">
            <ProductDetails />
            <Previewer />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
           <TechnicalPackage />
          
        </Layout.Section>
      </Layout>
    </Page>
  );
}
