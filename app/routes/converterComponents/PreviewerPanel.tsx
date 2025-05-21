// src/components/Previewer.tsx
import React from "react";
import { Card, Text, Box, ButtonGroup, Button, InlineStack } from "@shopify/polaris";

const Previewer = () => {
  return (
    <Card>
      <Box padding="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h2">
            Preview
          </Text>
          <ButtonGroup>
            <Button variant="primary" tone="critical">Delete</Button>
            <Button variant="primary">Save</Button>
          </ButtonGroup>
        </InlineStack>
      </Box>

      <Box
        minHeight="320px"
        background="bg-surface-secondary"
        padding="300"
        borderRadius="200"
      >
        <Text as="p" variant="bodyMd">
          Your preview 3D apparel will appear here.
        </Text>
      </Box>
    </Card>
  );
};

export default Previewer;
