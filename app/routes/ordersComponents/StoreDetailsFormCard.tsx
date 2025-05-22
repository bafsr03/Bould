import {
  Layout,
  LegacyCard,
  FormLayout,
  TextField,
  TextContainer,
  Text,
  Box, // Using Box for spacing for consistency with Polaris components
} from '@shopify/polaris';
import React from 'react';

export default function StoreDetailsFormCard() {
  return (
    <Layout>
      <Layout.Section variant="oneThird">
        {/* Replaced div with Box for consistent spacing */}
        <Box paddingBlockStart="400">
          <TextContainer>
            <Text id="storeDetails" variant="headingMd" as="h2">
              Store details
            </Text>
            <Text tone="subdued" as="p">
             Bould will use this information to contact
              you.
            </Text>
          </TextContainer>
        </Box>
      </Layout.Section>
      <Layout.Section>
        <LegacyCard sectioned>
          <FormLayout>
            <TextField
              label="Store name or Name of the person who placed the order"
              onChange={() => {}}
              autoComplete="off"
            />
            <TextField
              type="email"
              label="Account email"
              onChange={() => {}}
              autoComplete="email"
            />
          </FormLayout>
        </LegacyCard>
      </Layout.Section>
    </Layout>
  );
}