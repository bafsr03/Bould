import { Card, Text, Box, ButtonGroup, Button, InlineStack, Thumbnail } from "@shopify/polaris";

interface Props {
  imageUrl?: string | null;
  statusLabel?: string;
}

const Previewer = ({ imageUrl, statusLabel }: Props) => {
  return (
    <Card>
      <Box padding="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h2">
            Preview
          </Text>
          <ButtonGroup>
            <Button variant="primary" tone="critical">Delete</Button>
            <Button variant="primary">Convert</Button>
          </ButtonGroup>
        </InlineStack>
      </Box>

      <Box
        minHeight="320px"
        background="bg-surface-secondary"
        padding="300"
        borderRadius="200"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
        ) : (
          <Text as="p" variant="bodyMd">
            {statusLabel || "Your preview 3D apparel will appear here."}
          </Text>
        )}
      </Box>
    </Card>
  );
};

export default Previewer;
