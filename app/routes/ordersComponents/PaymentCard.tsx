
import React from 'react';
import {
  LegacyCard,
  LegacyStack,
  Badge,
  Text,
  Button,
  ButtonGroup,
  Divider,
  Box,
} from '@shopify/polaris';
import {
  PaymentIcon,
  EnvelopeIcon,
  EditIcon,
  CaretDownIcon,
} from '@shopify/polaris-icons';

// Helper component DetailRow (no changes)
type DetailRowProps = {
  left: React.ReactNode;
  middle?: React.ReactNode;
  right: React.ReactNode;
  leftBold?: boolean;
  rightBold?: boolean;
};

const DetailRow = ({
  left,
  middle,
  right,
  leftBold = false,
  rightBold = false,
}: DetailRowProps) => (
  <Box paddingBlockStart="100" paddingBlockEnd="100">
    <LegacyStack wrap={false} alignment="center">
      <LegacyStack.Item>
        <LegacyStack alignment="center" spacing="extraTight" wrap={false}>
          <Text variant="bodyMd" as="span" fontWeight={leftBold ? 'semibold' : undefined}>
            {left}
          </Text>
          {middle && (
            <Box paddingInlineStart="050">
              <Text variant="bodyMd" as="span">
                {middle}
              </Text>
            </Box>
          )}
        </LegacyStack>
      </LegacyStack.Item>
      <LegacyStack.Item fill>
        <Text
          variant="bodyMd"
          as="p"
          alignment="end"
          fontWeight={rightBold ? 'semibold' : undefined}
        >
          {right}
        </Text>
      </LegacyStack.Item>
    </LegacyStack>
  </Box>
);

// Helper TwoColumnRow (no changes to its definition, but its usage might need review if it contained submit buttons)
type TwoColumnRowProps = {
  left: React.ReactNode;
  rightText?: string;
  rightIconSource?: React.ElementType;
  rightIconAccessibilityLabel?: string;
};

const TwoColumnRow: React.FC<TwoColumnRowProps> = ({
  left,
  rightText,
  rightIconSource,
  rightIconAccessibilityLabel,
}) => (
  <Box paddingBlockStart="100" paddingBlockEnd="100">
    <LegacyStack  alignment="center" wrap={false}> {/* Corrected: Removed duplicate <LegacyStack> definition */}
      <LegacyStack.Item fill> {/* Added fill to allow left text to take space */}
         <Text variant="bodyMd" as="span">{left}</Text>
      </LegacyStack.Item>
      <LegacyStack.Item> {/* Wrap right content in an item for proper alignment */}
        <LegacyStack alignment="center" spacing="tight" wrap={false}>
          {rightText && (
            <Text variant="bodyMd" as="span">
              {rightText}
            </Text>
          )}
          {rightIconSource && ( // Conditionally render button if icon source is provided
             <Button
                icon={rightIconSource} // Use the passed icon source
                accessibilityLabel={rightIconAccessibilityLabel}
                onClick={() => console.log(`${rightIconAccessibilityLabel} clicked`)}
             />
          )}
        </LegacyStack>
      </LegacyStack.Item>
    </LegacyStack>
  </Box>
);


export default function PaymentCard() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LegacyCard>
        <Box padding="300">
          <Badge icon={PaymentIcon} tone="attention">
            Payment pending
          </Badge>
        </Box>

        <LegacyCard.Section subdued>
          <div style={{ flexGrow: 1, overflowY: 'auto'}}>
            <DetailRow
              left="Original order • May 15 2023"
              right="$ 1,250.00"
            />
            <Divider />
            <DetailRow
              left="Shipping"
              middle="50 items"
              right="$ 150.00"
            />
            <Divider />
            <DetailRow
              left="Total"
              right="$ 1,400.00"
              leftBold
              rightBold
            />
            <Divider />
            <TwoColumnRow
              left="Payment due when invoice is sent"
              rightIconSource={EditIcon} // Ensure EditIcon is correctly passed
              rightIconAccessibilityLabel="Edit payment due condition"
            />
          </div>
        </LegacyCard.Section>
        <LegacyCard.Section>
          <div style={{ flexShrink: 0 }}>
            <Box paddingBlockStart="050" paddingBlockEnd="0">
              <LegacyStack distribution="trailing">
                <ButtonGroup>
                  {/* This button will now submit the form in app.orders.tsx */}
                  <Button
                    submit // Changed from onClick to submit attribute
                    icon={EnvelopeIcon}
                  >
                    Generate invoice
                  </Button>
                  <Button
                    disabled // This remains a regular button, disabled
                    icon={CaretDownIcon}
                    onClick={() => console.log('Make payment clicked')}
                  >
                    Make payment
                  </Button>
                </ButtonGroup>
              </LegacyStack>
            </Box>
          </div>
        </LegacyCard.Section>
      </LegacyCard>
    </div>
  );
}