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

// Helper component for consistent row layout (3-part) - UNCHANGED
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

// Helper for simple two-column rows (unchanged) - UNCHANGED
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
    <LegacyStack  alignment="center" wrap={false}>
      <Text variant="bodyMd" as="span">{left}</Text>
      <LegacyStack alignment="center" spacing="tight" wrap={false}>
        {rightText && (
          <Text variant="bodyMd" as="span">
            {rightText}
          </Text>
        )}
        <Button
          icon={EditIcon}
          accessibilityLabel={rightIconAccessibilityLabel}
          onClick={() => console.log(`${rightIconAccessibilityLabel} clicked`)}
        />
      </LegacyStack>
    </LegacyStack>
  </Box>
);

export default function PaymentCard() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LegacyCard>
        {/* top badge - this section will not grow */}
        <Box padding="300">
          <Badge icon={PaymentIcon} tone="attention">
            Payment pending
          </Badge>
        </Box>

      {/* detail rows - this section will grow to fill available space */}
      <LegacyCard.Section subdued>
        <div style={{ flexGrow: 1, overflowY: 'auto' /* For scroll if content overflows */ }}>
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
            rightIconSource={EditIcon}
            rightIconAccessibilityLabel="Edit payment due condition"
          />
        </div>
      </LegacyCard.Section>
      <LegacyCard.Section>
        <div style={{ flexShrink: 0 }}>
          <Box paddingBlockStart="050" paddingBlockEnd="0">
            <LegacyStack distribution="trailing">
              <ButtonGroup>
                <Button
                  icon={EnvelopeIcon}
                  onClick={() => console.log('Send invoice clicked')}
                >
                  Generate invoice
                </Button>
                <Button
                  disabled
                  icon={CaretDownIcon}
                  
                  onClick={() => console.log('Collect payment clicked')}
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