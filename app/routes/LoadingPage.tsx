 
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
}

export default function LoadingPage({
  pageTitleInBar = "Loading...",
}: LoadingPageProps) {
  return (
    <Page titleHidden>
      <TitleBar title={pageTitleInBar} />
      <Layout>
        <Layout.Section>
          <Box paddingBlockStart="400" paddingBlockEnd="200">
            <SkeletonDisplayText size="extraLarge" />
          </Box>

          {/* initial content block */}
          <Box paddingBlockEnd="400">
            <LegacyCard sectioned>
              <SkeletonBodyText lines={2} />
            </LegacyCard>
          </Box>

          {/*  main content layout */}
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