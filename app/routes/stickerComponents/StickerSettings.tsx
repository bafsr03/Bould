// app/components/StickerSettings.tsx
import React from 'react';
import { Card, Box, Text, RangeSlider, FormLayout, Select } from '@shopify/polaris';

interface StickerSettingsProps {
  /** Scale percentage of the product preview (10–100) */
  imageScale: number;
  /** Handler when scale slider changes */
  onScaleChange: (value: number) => void;
  /** Padding in px around the product */
  morphologyPadding: number;
  /** Handler when padding slider changes */
  onPaddingChange: (value: number) => void;
  /** Selected finish value */
  stickerFinish: string;
  /** Handler when finish dropdown changes */
  onFinishChange: (value: string) => void;
  /** Selected overlay value */
  stickerOverlay: string;
  /** Handler when overlay dropdown changes */
  onOverlayChange: (value: string) => void;
}

export function StickerSettings({
  imageScale,
  onScaleChange,
  morphologyPadding,
  onPaddingChange,
  stickerFinish,
  onFinishChange,
  stickerOverlay,
  onOverlayChange,
}: StickerSettingsProps) {
  const finishOptions = [
    { label: 'Matte', value: 'Matte' },
    { label: 'Glossy', value: 'Glossy' },
  ];
  const overlayOptions = [
    { label: 'None', value: 'None' },
    { label: 'Vinyl', value: 'Vinyl' },
    { label: 'Holographic', value: 'Holographic' },
  ];

  return (
    <Card>
      <Box padding="400">
        <Text variant="bodyMd" as="h3" fontWeight="semibold">
          1. Adjust product size
        </Text>
        <Box paddingBlockStart="200" />
        <RangeSlider
          label="Adjust product size"
          value={imageScale}
          onChange={onScaleChange}
          output
          min={10}
          max={100}
          step={1}
          helpText="Scale the product within the preview."
        />
        <Box paddingBlockStart="400" />
        <Text variant="bodyMd" as="h3" fontWeight="semibold">
          2. Product padding (morphology)
        </Text>
        <Box paddingBlockStart="200" />
        <RangeSlider
          label="Product padding"
          value={morphologyPadding}
          onChange={onPaddingChange}
          output
          min={0}
          max={50}
          step={1}
          suffix="px"
          helpText="Add transparent padding around the sticker."
        />
        <Box paddingBlockStart="400" />
        <Text variant="bodyMd" as="h3" fontWeight="semibold">
          3. Choose sticker details
        </Text>
        <Box paddingBlockStart="200" />
        <FormLayout>
          <Select
            label="Sticker Finish"
            options={finishOptions}
            onChange={onFinishChange}
            value={stickerFinish}
          />
          <Select
            label="Sticker Overlay"
            options={overlayOptions}
            onChange={onOverlayChange}
            value={stickerOverlay}
          />
        </FormLayout>
      </Box>
    </Card>
  );
}
