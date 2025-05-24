import { useState } from 'react'; 
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
} from '@shopify/polaris-icons';

const armchairImageUrl =
  'https://i.imgur.com/p5eOV3L.png';

export default function OrderCard() {
  // State for the sticker quantity
  const [stickerQuantity, setStickerQuantity] = useState('100');

  const handleQuantityChange = (newValue: string) => {
    // Allow only numbers or empty string for clearing the input
    if (/^\d*$/.test(newValue)) {
      setStickerQuantity(newValue);
    }
  };

  // Calculate total price based on quantity
  // Assuming a base price of $0.95 per sticker for the example price of $95.00 for 100 stickers
  const pricePerSticker = 0.95;
  const currentQuantity = parseInt(stickerQuantity, 10) || 0;
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
        {/* Main stack */}
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

          {/* Right part: Quantity and Price */}
          <LegacyStack.Item fill>
            {/* Inner stack to arrange quantity and price */}
            <LegacyStack alignment="center" spacing="tight" wrap={false}>
              {/* Quantity part*/}
              <LegacyStack.Item>
                <TextField
                  label="Quantity"
                  labelHidden
                  type="text" // Using text to allow finer control with regex
                  value={stickerQuantity}
                  onChange={handleQuantityChange}
                  autoComplete="off"
                  prefix="x"
                  inputMode="numeric" // Helps mobile keyboards
  
                />
              </LegacyStack.Item>
              {/* Price part */}
              <LegacyStack.Item fill>
                <Text
                  variant="bodyMd"
                  fontWeight="semibold"
                  as="p"
                  alignment="end"
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
              disabled //  can be enabled based if ready for deployment 
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
