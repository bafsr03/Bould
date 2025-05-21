// src/pages/ConverterPage.tsx
import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  CalloutCard,
  InlineGrid,
  Box,
  Tabs,
  LegacyCard,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  TextContainer,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import DropZoneUploader from "./converterComponents/DropZoneUploader";
import ProductIndexTable from "./converterComponents/ProductIndexTable";
import TechnicalPackage from "./converterComponents/TechnicalPackage";
import Previewer from "./converterComponents/PreviewerPanel";
import ProductDetails from "./converterComponents/ProductDetails";
import LibraryTable from "./converterComponents/LibraryTable";

export default function ConverterPage() {
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    []
  );

  const tabs = [
    {
      id: "converter",
      content: "Converter",
      panelID: "converter-panel",
    },
    {
      id: "library",
      content: "Library",
      panelID: "library-panel",
    },
    {
      id: "analytics",
      content: "Analytics",
      panelID: "analytics-panel",
    },
  ];

  const renderAnalyticsSection = () => (
    <>
      <Banner
        title="Analytics coming soon in the next update"
        tone="info"
        onDismiss={() => {}}
      >
        <p>We’re actively working on this feature. Stay tuned!</p>
      </Banner>

      <SkeletonPage primaryAction>
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned>
              <SkeletonBodyText />
            </LegacyCard>
            <LegacyCard sectioned>
              <TextContainer>
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText />
              </TextContainer>
            </LegacyCard>
            <LegacyCard sectioned>
              <TextContainer>
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText />
              </TextContainer>
            </LegacyCard>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <LegacyCard>
              <LegacyCard.Section>
                <TextContainer>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                </TextContainer>
              </LegacyCard.Section>
              <LegacyCard.Section>
                <SkeletonBodyText lines={1} />
              </LegacyCard.Section>
            </LegacyCard>
            <LegacyCard subdued>
              <LegacyCard.Section>
                <TextContainer>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                </TextContainer>
              </LegacyCard.Section>
              <LegacyCard.Section>
                <SkeletonBodyText lines={2} />
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </SkeletonPage>
    </>
  );

  return (
    <Page>
      <TitleBar title="Bould" />
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
            <LegacyCard.Section >
              {selected === 0 && (
                <>
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

                  <Box paddingBlockStart="400">
                    <InlineGrid
                      columns={{ xs: "1fr", sm: ["oneThird", "twoThirds"] }}
                      gap="400"
                    >
                      <ProductDetails />
                      <Previewer />
                    </InlineGrid>
                  </Box>

                  <Box paddingBlockStart="400">
                    <TechnicalPackage />
                  </Box>
                </>
              )}

              {selected === 1 && (
                <LibraryTable />
              )}

              {selected === 2 && renderAnalyticsSection()}
            </LegacyCard.Section>
          </Tabs>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
