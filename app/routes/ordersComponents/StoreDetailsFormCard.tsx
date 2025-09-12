// app/ordersComponents/StoreDetailsFormCard.tsx

import React, { useState, useEffect } from "react";
import {
  Layout,
  LegacyCard,
  FormLayout,
  TextField,
  TextContainer,
  Text,
  Box,
  // Button, // No longer needed here
} from "@shopify/polaris";
import { useActionData } from "@remix-run/react"; // Form import removed, useActionData remains

type StoreDetailsFormCardProps = {
  initialStoreName: string;
  initialAccountEmail: string;
};

type ActionData = {
  intent?: string;
  errors?: {
    storeName?: string;
    accountEmail?: string;
  };
  submittedValues?: {
    storeName?: string;
    accountEmail?: string;
  }
};

export default function StoreDetailsFormCard({
  initialStoreName,
  initialAccountEmail,
}: StoreDetailsFormCardProps) {
  const actionData = useActionData<ActionData>();

  const errors =
    actionData?.intent === "updateStoreDetails" ? actionData.errors : undefined;

  const [storeName, setStoreName] = useState(
    actionData?.intent === "updateStoreDetails" && actionData.submittedValues?.storeName !== undefined
      ? actionData.submittedValues.storeName
      : initialStoreName
  );
  const [accountEmail, setAccountEmail] = useState(
    actionData?.intent === "updateStoreDetails" && actionData.submittedValues?.accountEmail !== undefined
      ? actionData.submittedValues.accountEmail
      : initialAccountEmail
  );

  useEffect(() => {
    if (actionData?.intent !== "updateStoreDetails" || !actionData.errors) {
        setStoreName(initialStoreName);
    }
  }, [initialStoreName, actionData]);

  useEffect(() => {
    if (actionData?.intent !== "updateStoreDetails" || !actionData.errors) {
        setAccountEmail(initialAccountEmail);
    }
  }, [initialAccountEmail, actionData]);

  return (
    // The <Form> tag is removed from here. It's now in app.orders.tsx
    // The Layout and other Polaris components remain for structure.
    <>
      {/* Hidden input to identify this form's submission's intent */}
      {/* This MUST be within the <Form> rendered by the parent */}
      <input type="hidden" name="intent" value="updateStoreDetails" />
      <Layout>
        <Layout.Section variant="oneThird">
          <Box paddingBlockEnd="400">
            <TextContainer>
              <Text id="storeDetails" variant="headingMd" as="h2">
                Store details
              </Text>
              <Text tone="subdued" as="p">
                Bould will use this information to contact you.
              </Text>
            </TextContainer>
          </Box>
        </Layout.Section>

        <Layout.Section>
          <LegacyCard>
            <LegacyCard.Section>
              <FormLayout>
                <TextField
                  name="storeName" // This name is crucial for form submission
                  label="Store name or Name of the person who placed the order"
                  value={storeName}
                  onChange={setStoreName}
                  autoComplete="off"
                  error={errors?.storeName}
                />
                <TextField
                  type="email"
                  name="accountEmail" // This name is crucial for form submission
                  label="Account email"
                  value={accountEmail}
                  onChange={setAccountEmail}
                  autoComplete="email"
                  error={errors?.accountEmail}
                />
                {/* Save Button is removed as per request */}
                {/* <Button submit>Save</Button> */}
              </FormLayout>
            </LegacyCard.Section>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </>
  );
}