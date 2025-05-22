// app/components/ImagePreview.tsx
import { Box, Text } from '@shopify/polaris';

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
    backgroundSize: '24px 24px', // Slightly larger squares
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--p-border-radius-300)', // Consistent rounding
    minHeight: '350px', // Ensure a substantial preview area
    padding: 'var(--p-space-400)', // Add some internal padding
    boxSizing: 'border-box',
  };

  return (
    // The image preview area doesn't seem to be a Card in the screenshot,
    // but a Box can provide structure and styling.
    <Box
      background="bg-surface-secondary" // A slightly different background to stand out
      borderRadius="300"
 // Attempt to fill available vertical space
      borderColor="border"
      borderWidth="025"
    >
      <div style={checkeredBackgroundStyle}>
        <img
          src={productImage}
          alt="Product Preview"
          style={{
            maxWidth: '75%', // Ensure image doesn't touch edges
            maxHeight: '75%',
            objectFit: 'contain',
            // The image itself should ideally have a transparent background
          }}
        />
      </div>
      {/* You could add generated image thumbnails below this main preview later */}
       <Box padding="400">
        <Text alignment="center" as='h2' tone="subdued" >Generated variations will appear here.</Text>
      </Box>
    </Box>
  );
}