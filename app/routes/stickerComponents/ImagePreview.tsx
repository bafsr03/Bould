
// app/components/ImagePreview.tsx
import { Box, Text } from '@shopify/polaris';
import { ShinySticker }  from './ShinySticker'; // Ensure this path is correct

interface ImagePreviewProps {
  productImage: string;
}

export function ImagePreview({ productImage }: ImagePreviewProps) {
  const checkeredBackgroundStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--p-border-radius-300)',
    minHeight: '350px',
    padding: 'var(--p-space-400)',
    boxSizing: 'border-box',
  };

  return (
    <Box
      background="bg-surface-secondary"
      borderRadius="300"
      borderColor="border"
      borderWidth="025"
    >
      <div style={checkeredBackgroundStyle}>
        {productImage ? (
          // Wrapper to control the size of the ShinySticker
          <div style={{ maxWidth: '75%', maxHeight: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShinySticker
              url="https://i.imgur.com/p5eOV3L.png"
              rotate="0deg" // Default rotation, can be dynamic later
              // width prop will default to 100% of this ^ div wrapper
            />
          </div>
        ) : (
          <Text tone="subdued" as="p" alignment="center">
            Product image will appear here.
          </Text>
        )}
        {/* Removed the old img tag and the separate ShinySticker instance */}
      </div>
      <Box padding="400">
        <Text alignment="center" as='h2' tone="subdued" >Generated variations will appear here.</Text>
      </Box>
    </Box>
  );
}
