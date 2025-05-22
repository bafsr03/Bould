import React from 'react';
import {
  LegacyCard,
  LegacyStack,
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

const lineItems = [
  {
    id: 1,
    name: 'Bould Blanks Hoodie',
    tags: ['Nylon', 'Woven'],
    quantity: 50,
    price: 1250.00,
    imageUrl: armchairImageUrl,
  },
  {
    id: 2,
    name: 'Bould Blanks T-Shirt',
    tags: ['Cotton', 'Knit'],
    quantity: 100,
    price: 750.00,
    imageUrl: 'https://burst.shopifycdn.com/photos/white-tshirt-on-hanger.jpg?width=100',
  },
  {
    id: 3,
    name: 'Bould Blanks Cap',
    tags: ['Polyester', 'Structured'],
    quantity: 30,
    price: 450.00,
    imageUrl: 'https://burst.shopifycdn.com/photos/black-snapback-hat.jpg?width=100',
  },
  {
    id: 4,
    name: 'Bould Performance Shorts',
    tags: ['Spandex', 'Mesh'],
    quantity: 75,
    price: 900.00,
    imageUrl: 'https://burst.shopifycdn.com/photos/gray-workout-shorts.jpg?width=100',
  },
  {
    id: 5,
    name: 'Bould Cozy Sweater',
    tags: ['Wool', 'Cable Knit'],
    quantity: 20,
    price: 1500.00,
    imageUrl: 'https://burst.shopifycdn.com/photos/knitted-sweater-on-a-white-background.jpg?width=100',
  },
];

export default function OrderCard() {
  return (
    <LegacyCard style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <LegacyCard.Header title="Place an order" />

      {/* Order Summary Section (fixed part) */}
      <LegacyCard.Section>
        <LegacyStack alignment="center" wrap={false}>
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
          <LegacyStack.Item fill>
            <Text
              variant="bodyMd"
              fontWeight="semibold"
              as="p"
              alignment="end"
            >
              $25.00 {/* This seems to be a fixed fee or summary not related to line items sum */}
            </Text>
          </LegacyStack.Item>
        </LegacyStack>
        <Box paddingBlockStart="300" paddingBlockEnd="300">
          <Text variant="bodyMd" tone="critical" as="p">
            Missing sizes and colors. Go back to converter
          </Text>
        </Box>
      </LegacyCard.Section>

      <Divider /> {/* Divider between summary and list */}

      {/* Line Items List (scrollable part) */}
      <Box
        style={{
          flexGrow: 1, // Allows this section to take available vertical space
          overflowY: 'auto', // Enables vertical scrolling if content exceeds maxHeight
          padding: 'var(--p-space-400)', // Standard padding for sections
          maxHeight: '10rem', // Limits visible height to ~2 items (1rem ~ 16px, so 160px)
                              // Adjust this value to fine-tune how many items are visible
          minHeight: 0, // Important for flex children with overflow to prevent layout issues
        }}
      >
        {lineItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <LegacyStack alignment="center" wrap={false}>
              <LegacyStack.Item>
                <LegacyStack alignment="center" spacing="baseTight" wrap={false}>
                  <Thumbnail
                    source={item.imageUrl}
                    alt={item.name}
                    size="medium"
                  />
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold" as="p">
                      {item.name}
                    </Text>
                    <LegacyStack spacing="extraTight" wrap={false}>
                      {item.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </LegacyStack>
                  </div>
                </LegacyStack>
              </LegacyStack.Item>
              <LegacyStack.Item fill>
                <LegacyStack alignment="center" spacing="tight" wrap={false}>
                  <LegacyStack.Item>
                    <Text variant="bodyMd" as="p">
                      x{item.quantity}
                    </Text>
                  </LegacyStack.Item>
                  <LegacyStack.Item fill>
                    <Text
                      variant="bodyMd"
                      fontWeight="semibold"
                      as="p"
                      alignment="end"
                    >
                      ${item.price.toFixed(2)}
                    </Text>
                  </LegacyStack.Item>
                </LegacyStack>
              </LegacyStack.Item>
            </LegacyStack>
            {/* Add a divider between items, but not after the last one */}
            {index < lineItems.length - 1 && (
              <Box paddingBlockStart="400" paddingBlockEnd="400">
                <Divider />
              </Box>
            )}
          </React.Fragment>
        ))}
        {lineItems.length === 0 && (
            <Text as="p" tone="subdued" alignment='center'>No items in this order.</Text>
        )}
      </Box>

      {/* Actions Section (fixed part at the bottom) */}
      {/* This section is pushed to the bottom because the Line Items Box has flexGrow: 1 */}
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