

import React, { useState } from 'react'; // Added useState
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
  TextField, // Added TextField
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
  // State for the sticker quantity
  const [stickerQuantity, setStickerQuantity] = useState('100'); // Initial quantity as string

  const handleQuantityChange = (newValue: string) => {
    // Allow only numbers or empty string for clearing the input
    if (/^\d*$/.test(newValue)) {
      setStickerQuantity(newValue);
    }
  };

  // Calculate total price based on quantity
  // Assuming a base price of $0.95 per sticker for the example price of $95.00 for 100 stickers
  const pricePerSticker = 0.95;
  const currentQuantity = parseInt(stickerQuantity, 10) || 0; // Parse to int, default to 0 if NaN
  const totalPrice = (currentQuantity * pricePerSticker).toFixed(2);


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
                <TextField
                  label="Quantity"
                  labelHidden
                  type="text" // Using text to allow finer control with regex, but acts like number
                  value={stickerQuantity}
                  onChange={handleQuantityChange}
                  autoComplete="off"
                  prefix="x"
                  inputMode="numeric" // Helps mobile keyboards
                  // You might want to add min/max or other validation as needed
                  // For example, to ensure it's not negative or zero in some contexts
                />
              </LegacyStack.Item>
              {/* Price part, fills remaining space in this inner stack */}
              <LegacyStack.Item fill>
                <Text
                  variant="bodyMd"
                  fontWeight="semibold"
                  as="p"
                  alignment="end" // Align price text to the right
                >
                  ${totalPrice}
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
            <Button onClick={() => console.log('Make an Order clicked with quantity:', stickerQuantity)}>
              Make an Order
            </Button>
            <Button
              variant="primary"
              disabled // Kept disabled as per original, can be enabled based on logic
              icon={PlusIcon}
              onClick={() => console.log('Make Payment clicked')}
            >
              Make Payment
            </Button>
          </ButtonGroup>
        </LegacyStack>
      </LegacyCard.Section>
    </LegacyCard>
  );
}
