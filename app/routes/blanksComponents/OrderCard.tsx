import React, { useState, useCallback } from 'react';
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
  TextField,
} from '@shopify/polaris';
import {
  ReceiptIcon,
  AlertCircleIcon,
  InfoIcon,
  PlusIcon,
  XCircleIcon,
} from '@shopify/polaris-icons';

interface EditableLineItem {
  id: number;
  name: string;
  tags: string[];
  quantity: number;
  price: number;
  imageUrl: string;
  unitPrice: number;
}

const initialLineItemsData = [
  {
    id: 1,
    name: 'Blanks Hoodie',
    tags: ['Nylon', 'Woven'],
    quantity: 50,
    price: 1250.0,
    imageUrl: "https://i.imgur.com/H7Utdza.png",
  },
  {
    id: 2,
    name: 'Blanks Short Sleeve Shirt',
    tags: ['Cotton', 'Knit'],
    quantity: 20,
    price: 900.0,
    imageUrl:
      'https://i.imgur.com/RKj4YfK.png',
  },
  {
    id: 3,
    name: ' Blanks Cap',
    tags: ['Polyester', 'Structured'],
    quantity: 30,
    price: 450.0,
    imageUrl:
      'https://i.imgur.com/vcFmbkv.png',
  },
  {
    id: 4,
    name: 'Blanks Performance Shorts',
    tags: ['Spandex', 'Mesh'],
    quantity: 75,
    price: 900.0,
    imageUrl:
      'https://i.imgur.com/0n9LFk6.png',
  },
  {
    id: 5,
    name: 'Blanks Cozy Sweater',
    tags: ['Wool', 'Cable Knit'],
    quantity: 20,
    price: 1500.0,
    imageUrl:
      'https://i.imgur.com/ExxOg26.png',
  },
];

export default function OrderCard() {
  const [lineItems, setLineItems] = useState<EditableLineItem[]>(() =>
    initialLineItemsData.map(item => ({
      ...item,
      unitPrice: item.quantity !== 0 ? item.price / item.quantity : 0,
    }))
  );

  const handleQuantityChange = useCallback((itemId: number, newQuantityStr: string) => {
    setLineItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          if (!/^\d*$/.test(newQuantityStr)) {
            return item;
          }
          const newQuantity = newQuantityStr === '' ? 0 : parseInt(newQuantityStr, 10);
          return {
            ...item,
            quantity: newQuantity,
            price: newQuantity * item.unitPrice,
          };
        }
        return item;
      })
    );
  }, []);

  const handleDeleteItem = useCallback((itemIdToDelete: number) => {
    setLineItems(prevItems => prevItems.filter(item => item.id !== itemIdToDelete));
  }, []);

  const totalOrderPrice = lineItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <LegacyCard>
        <LegacyCard.Header title="Place an order" />

        {/* Order Summary Section */}
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
              <Box >
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  ${totalOrderPrice.toFixed(2)}
                </Text>
              </Box>
            </LegacyStack.Item>
          </LegacyStack>

          <Box paddingBlockStart="300" paddingBlockEnd="300">
            <Text variant="bodyMd" tone="critical" as="p">
              Missing sizes and colors. Go back to converter
            </Text>
          </Box>
        </LegacyCard.Section>

        <Divider />

        {/* Line Items List */}
        <LegacyCard.Section>
          <Box
            padding="400"
            style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '10rem', minHeight: 0 }} //What to f do with this style idk but its important.
          >
            {lineItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <LegacyStack alignment="center" wrap={false} spacing="loose">
                  <LegacyStack.Item>
                    <LegacyStack alignment="center" spacing="baseTight" wrap={false}>
                      <Thumbnail source={item.imageUrl} alt={item.name} size="medium" />
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
                        <Box width="80px"> {/* Constrain width of TextField container */}
                          <TextField
                            label={`Quantity for ${item.name}`}
                            labelHidden
                            type="text"
                            value={item.quantity.toString()}
                            onChange={(value) => handleQuantityChange(item.id, value)}
                            autoComplete="off"
                            prefix="x"
                            inputMode="numeric"
                          />
                        </Box>
                      </LegacyStack.Item>
                      <LegacyStack.Item fill>
                        <Box >
                          <Text variant="bodyMd" fontWeight="semibold" as="p">
                            ${item.price.toFixed(2)}
                          </Text>
                        </Box>
                      </LegacyStack.Item>
                    </LegacyStack>
                  </LegacyStack.Item>
                  {/* Delete Button Item */}
                  <LegacyStack.Item>
                    <Button
                      icon={XCircleIcon}
                      onClick={() => handleDeleteItem(item.id)}
                      accessibilityLabel={`Remove ${item.name}`}
                      variant="plain"
                      tone="critical"
                    />
                  </LegacyStack.Item>
                </LegacyStack>
                {index < lineItems.length - 1 && (
                  <Box paddingBlockStart="400" paddingBlockEnd="400">
                    <Divider />
                  </Box>
                )}
              </React.Fragment>
            ))}
            {lineItems.length === 0 && (
              <Box padding="400"> {/* Added padding and centering */}
                <Text as="p" tone="subdued">
                  No items in this order.
                </Text>
              </Box>
            )}
          </Box>
        </LegacyCard.Section>

        {/* Actions Section */}
        <LegacyCard.Section>
          <LegacyStack distribution="trailing">
            <ButtonGroup>
              <Button
                onClick={() => console.log('Update orders clicked. Current items:', lineItems)}
                disabled={lineItems.length === 0}
              >
                Update orders
              </Button>
              <Button
                variant="primary"
                disabled={lineItems.length === 0 || totalOrderPrice === 0}
                icon={PlusIcon}
              >
                Create order
              </Button>
            </ButtonGroup>
          </LegacyStack>
        </LegacyCard.Section>
      </LegacyCard>
    </Box>
  );
}
