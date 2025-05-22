import {
  Text,
  BlockStack,
  InlineStack,
  Divider,
  Badge,
  InlineGrid,
  LegacyCard,
} from '@shopify/polaris';

export default function TechnicalPackageCard() {
  const constructionDetails = [
    { reference: 'Logo', type: 'Embroidered', volume: '2' },
    { reference: 'Interior Taping', type: '-', volume: 'None' },
    { reference: 'Visor Peak Stitching', type: 'Stitched', volume: '7' },
    { reference: 'Label Snap', type: '-', volume: 'None' },
    { reference: 'Needle Bottom', type: 'Coverstitch', volume: '2' },
  ];

  return (
    <LegacyCard>
      <LegacyCard.Section>
        <BlockStack gap="300">
          {/* Technical Attributes */}
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">Technical</Text>
            <InlineStack gap="200" wrap>
              <Badge>Fabric: 100% Cotton</Badge>
              <Badge>Fit: Relaxed</Badge>
              <Badge>Care: Machine wash cold</Badge>
            </InlineStack>
          </BlockStack>

          <Divider />

          {/* Construction Details as Grid */}
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">Construction Details</Text>

            {/* Table Header */}
            <InlineGrid columns={['oneThird', 'oneThird', 'oneThird']} gap="200">
              <Text as='p' tone="subdued" fontWeight="semibold">REFERENCE</Text>
              <Text as='p' tone="subdued" fontWeight="semibold">TYPE</Text>
              <Text as='p' tone="subdued" fontWeight="semibold">VOLUME</Text>
            </InlineGrid>

            {/* Table Rows */}
            {constructionDetails.map((item, index) => (
              <InlineGrid columns={['oneThird', 'oneThird', 'oneThird']} gap="200" key={index}>
                <Text as='p' fontWeight="medium">{item.reference}</Text>
                <Text as='p'>{item.type}</Text>
                <Text as='p'>{item.volume}</Text>
              </InlineGrid>
            ))}
          </BlockStack>
        </BlockStack>
      </LegacyCard.Section>
    </LegacyCard>
  );
}