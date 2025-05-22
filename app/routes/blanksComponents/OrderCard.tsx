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
  'https://burst.shopifycdn.com/photos/blue-armchair-against-white-background.jpg?width=100';

export default function OrderCard() {
  return (
    <LegacyCard>
      <LegacyCard.Header title="Last order placed" />

      {/* Order Summary Section */}
      <LegacyCard.Section>
        {/* Main stack for this row */}
        <LegacyStack alignment="center" wrap={false}>
          {/* Left part: Badges */}
          <LegacyStack.Item>
            <LegacyStack spacing="tight" alignment="center" wrap={false}>
              <Badge icon={ReceiptIcon}>#041</Badge>
              <Badge tone="warning" icon={AlertCircleIcon}>
                Payment pending
              </Badge>
              <Badge tone="attention" icon={InfoIcon}>
                Unfulfilled
              </Badge>
            </LegacyStack>
          </LegacyStack.Item>

          {/* Right part: Price, fills remaining space */}
          <LegacyStack.Item fill>
            <Text
              variant="bodyMd"
              fontWeight="semibold"
              as="p"
              alignment="end" // Align text to the right
            >
              $25.00
            </Text>
          </LegacyStack.Item>
        </LegacyStack>

        {/* Date with extra spacing above & below */}
        <Box paddingBlockStart="300" paddingBlockEnd="300">
          <Text variant="bodyMd" tone="critical" as="p">
            Missing sizes and colors. Go back to converter
          </Text>
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
                  Bould Blanks Hoodie
                </Text>
                <LegacyStack spacing="extraTight" wrap={false}>
                  <Tag>Nylon</Tag>
                  <Tag>Woven</Tag>
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
                  x50
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
                  $1,250.00
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
              Update orders
            </Button>
            <Button
              variant="primary"
              disabled
              icon={PlusIcon}
              onClick={() => console.log('Create order clicked')}
            >
              Create order
            </Button>
          </ButtonGroup>
        </LegacyStack>
      </LegacyCard.Section>
    </LegacyCard>
  );
}