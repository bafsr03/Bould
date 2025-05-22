
import {
  Page,
  Layout,
  Box,
  Text,
  Link,
  SkeletonBodyText,
  SkeletonDisplayText,
  LegacyCard,
  TextContainer,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

interface LoadingPageProps {
  pageTitleInBar?: string; // Title for the Shopify App Bridge TitleBar
  // The main H1 header text will be represented by a SkeletonDisplayText
}

export default function LoadingPage({
  pageTitleInBar = "Loading...",
}: LoadingPageProps) {
  return (
    <Page titleHidden>
      <TitleBar title={pageTitleInBar} />
      <Layout>
        <Layout.Section>
          {/* Mimic the heading structure (e.g., <Text variant="headingXl" as="h1">Page Title</Text>) */}
          <Box paddingBlockStart="400" paddingBlockEnd="200">
            <SkeletonDisplayText size="extraLarge" />
          </Box>

          {/* Mimic a banner or initial content block (like the Beta banner or CalloutCard) */}
          <Box paddingBlockEnd="400">
            <LegacyCard sectioned>
              <SkeletonBodyText lines={2} />
            </LegacyCard>
          </Box>

          {/* Mimic main content layout (example structure) */}
          <Layout>
            <Layout.Section>
              <LegacyCard sectioned>
                <TextContainer>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={3} />
                </TextContainer>
              </LegacyCard>
              <LegacyCard sectioned>
                <TextContainer>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                </TextContainer>
              </LegacyCard>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <LegacyCard sectioned>
                <SkeletonBodyText lines={2} />
              </LegacyCard>
              <LegacyCard subdued sectioned>
                <SkeletonBodyText lines={1} />
              </LegacyCard>
            </Layout.Section>
          </Layout>
        </Layout.Section>
      </Layout>

      {/* Consistent Footer */}
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
  );
}