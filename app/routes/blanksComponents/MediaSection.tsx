import React from 'react';
import { LegacyCard, Box, InlineGrid, Button, LegacyStack } from '@shopify/polaris';

interface MediaSectionProps {
  images: string[];
}

export default function MediaSection({ images }: MediaSectionProps) {
  return (
    <LegacyCard sectioned>
      <Box paddingBlockStart="400">
        <InlineGrid columns={2} gap="100">
          {/* Main image */}
          <Box padding="100">
            <img
              src={images[0]}
              alt="Main media"
              style={{ width: '100%', objectFit: 'cover', display: 'block', borderRadius: '10px' }}
            />
          </Box>

          {/* Nested grid of four images */}
          <InlineGrid columns={2} gap="100">
            {images.slice(1, 5).map((src, idx) => (
              <Box key={idx} padding="100">
                <img
                  src={src}
                  alt={`Media ${idx + 2}`}
                  style={{ width: '100%', objectFit: 'cover', display: 'block', borderRadius: '10px' }}
                />
              </Box>
            ))}
          </InlineGrid>
        </InlineGrid>

        {/* Right-aligned button */}
        <Box paddingBlockStart="200">
          <LegacyStack distribution="trailing">
            <Button disabled>Add product</Button>
          </LegacyStack>
        </Box>
      </Box>
    </LegacyCard>
  );
}
