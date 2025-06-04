
import React from "react";
import {
  Banner,
  Layout,
  LegacyCard,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  TextContainer,
} from "@shopify/polaris";

export default function AnalyticsSection() {
  return (
    <>
      <Banner
        title="Analytics coming soon in the next update"
        tone="info"
        onDismiss={() => {}}
      >
        <p>We're actively working on this feature. Stay tuned!</p>
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
}
