import {
  Layout,
  LegacyCard,
  FormLayout,
  TextField,
  TextContainer,
  Text,
  Box,
} from '@shopify/polaris';

import { useState } from 'react';
type StoreDetailsFormState = {
  storeName: string;
  accountEmail: string;
};

export default function StoreDetailsFormCard() {

const [ formState, setFormState ] = useState<StoreDetailsFormState>({
  storeName: '',
  accountEmail: '',
});


  return (
    <Layout>
      <Layout.Section variant="oneThird">
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
              value={formState.storeName}
              onChange={(value) => setFormState({ ...formState, storeName: value })}
              autoComplete="off"
            />
            <TextField
              type="email"
              label="Account email"
              value={formState.accountEmail}
              onChange={(value) => setFormState({ ...formState, accountEmail: value })}
              autoComplete="email"
            />
          </FormLayout>
        </LegacyCard>
      </Layout.Section>
    </Layout>
  );
}