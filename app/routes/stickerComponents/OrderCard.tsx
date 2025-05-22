import React from 'react';
import {
  LegacyCard,
  LegacyStack, // LegacyStack.Item will be used from here
  Badge,
  Text,
  Thumbnail,
  Tag,
  Button,
  ButtonGroup,
  Divider,
  Box,
} from '@shopify/polaris';
import {
  ReceiptIcon,
  AlertCircleIcon,
  InfoIcon,
  PlusIcon,
} from '@shopify/polaris-icons';

const armchairImageUrl =
  'https://i.imgur.com/p5eOV3L.png';

export default function OrderCard() {
  return (
    <LegacyCard>
      <LegacyCard.Header title="Place an order" />

      {/* Order Summary Section */}
      <LegacyCard.Section>
        {/* Main stack for this row */}
        <LegacyStack alignment="center" wrap={false}>
          {/* Left part: Badges */}
          <LegacyStack.Item>
            <LegacyStack spacing="tight" alignment="center" wrap={false}>
              <Badge icon={ReceiptIcon}>#042</Badge>
              <Badge tone="warning" icon={AlertCircleIcon}>
                Payment pending
              </Badge>
              <Badge tone="attention" icon={InfoIcon}>
                Unfulfilled
              </Badge>
            </LegacyStack>
          </LegacyStack.Item>


        </LegacyStack>

        {/* Date with extra spacing above & below */}
        <Box paddingBlockStart="200" paddingBlockEnd="200">
        </Box>
      </LegacyCard.Section>

      <Divider />

      {/* Line Item Section */}
      <LegacyCard.Section>
        {/* Main stack for this line item row */}
        <LegacyStack alignment="center" wrap={false}>
          {/* Left part: Thumbnail, Name, Tags */}
          <LegacyStack.Item>
            <LegacyStack alignment="center" spacing="baseTight" wrap={false}>
              <Thumbnail
                source={armchairImageUrl}
                alt="Tulipan Armchair"
                size="medium"
              />
              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Batch of Stickers 
                </Text>
                <LegacyStack spacing="extraTight" wrap={false}>
                  <Tag>Vinyl</Tag>
                  <Tag>Matte</Tag>
                </LegacyStack>
              </div>
            </LegacyStack>
          </LegacyStack.Item>

          {/* Right part: Quantity and Price, fills remaining space */}
          <LegacyStack.Item fill>
            {/* Inner stack to arrange quantity and price */}
            <LegacyStack alignment="center" spacing="tight" wrap={false}>
              {/* Quantity part, takes its natural width */}
              <LegacyStack.Item>
                <Text variant="bodyMd" as="p">
                  x100
                </Text>
              </LegacyStack.Item>
              {/* Price part, fills remaining space in this inner stack */}
              <LegacyStack.Item fill>
                <Text
                  variant="bodyMd"
                  fontWeight="semibold"
                  as="p"
                  alignment="end" // Align price text to the right
                >
                  $95.00
                </Text>
              </LegacyStack.Item>
            </LegacyStack>
          </LegacyStack.Item>
        </LegacyStack>
      </LegacyCard.Section>

      {/* Actions Section */}
      <LegacyCard.Section>
        <LegacyStack distribution="trailing">
          <ButtonGroup>
            <Button onClick={() => console.log('Update orders clicked')}>
              Make an Order
            </Button>
            <Button
              variant="primary"
              disabled
              icon={PlusIcon}
              onClick={() => console.log('Create order clicked')}
            >
              Make Payment
            </Button>
          </ButtonGroup>
        </LegacyStack>
      </LegacyCard.Section>
    </LegacyCard>
  );
}