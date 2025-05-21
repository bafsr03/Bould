import {
  Page,
  Layout,
  Text,
  Box,
  BlockStack,
  InlineStack,
  Divider,
  Button,
  Popover,
  ActionList,
  Badge,
  InlineGrid,
} from '@shopify/polaris';
import {
  ImportIcon,
  EditIcon,
  DeleteIcon,
} from '@shopify/polaris-icons';
import { useState, useCallback } from 'react';

export default function TechnicalPackageCard() {
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const activator = (
    <Button onClick={toggleActive} disclosure>
      More actions
    </Button>
  );

  const constructionDetails = [
    { reference: 'Logo', type: 'Embroidered', volume: '2' },
    { reference: 'Interior Taping', type: '-', volume: 'None' },
    { reference: 'Visor Peak Stitching', type: 'Stitched', volume: '7' },
    { reference: 'Label Snap', type: '-', volume: 'None' },
    { reference: 'Needle Bottom', type: 'Coverstitch', volume: '2' },
  ];

  return (
    <Page title="Technical Package">
      <Layout>
        <Layout.Section>
          <Box padding="400" background="bg-surface" borderRadius="300">
            <BlockStack gap="300">
              {/* Title and Actions */}
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">
                  Bould 5 Panel Hat SS01
                </Text>
                <Popover
                  active={active}
                  activator={activator}
                  autofocusTarget="first-node"
                  onClose={toggleActive}
                >
                  <ActionList
                    actionRole="menuitem"
                    sections={[
                      {
                        title: 'File options',
                        items: [{ content: 'Import file', icon: ImportIcon }],
                      },
                      {
                        title: 'Bulk actions',
                        items: [
                          { content: 'Edit', icon: EditIcon },
                          { content: 'Delete', icon: DeleteIcon, destructive: true },
                        ],
                      },
                    ]}
                  />
                </Popover>
              </InlineStack>

              <Divider />

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
                    <Text as='p' >{item.type}</Text>
                    <Text as='p'>{item.volume}</Text>
                  </InlineGrid>
                ))}
              </BlockStack>

              <Divider />

              {/* Uncomment and customize if needed
              <BlockStack gap="200">
                <Text as="p" fontWeight="bold">Price lists</Text>
                <Box>
                  <Text as="p" tone="subdued">2022 — 10% overall adjustment</Text>
                  <Text as="p" tone="subdued">Summer — 10% overall adjustment</Text>
                  <Text as="p" tone="subdued">Wholesale — 10% overall adjustment</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    +22 more
                  </Text>
                </Box>
              </BlockStack>
              */}
            </BlockStack>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
