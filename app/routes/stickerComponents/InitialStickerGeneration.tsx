// app/components/InitialStickerGeneration.tsx
import { useState, useCallback } from 'react';
import {
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  TextField,
  Box,
  Thumbnail,
} from '@shopify/polaris';
import { ProductIcon, UploadIcon } from '@shopify/polaris-icons'; // NoteIcon for the tag icon
import { ShinySticker } from './ShinySticker'; // Import ShinySticker component

// Placeholder image URL for demonstration
const DEFAULT_PRODUCT_IMAGE_UPLOADED = 'https://burst.shopifycdn.com/photos/orange-leather-cap-with-white-letter-c.jpg?width=373&format=pjpg&exif=0&iptc=0';

interface InitialStickerGenerationProps {
  onGenerate: (image: string, prompt: string) => void;
}

export function InitialStickerGeneration({ onGenerate }: InitialStickerGenerationProps) {
  const [stickerPrompt, setStickerPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handlePromptChange = useCallback((value: string) => setStickerPrompt(value), []);

  const handleSimulateImageSelection = () => {
    // In a real app, this would involve a file upload or product picker
    setSelectedImage(DEFAULT_PRODUCT_IMAGE_UPLOADED);
  };

  const handleGenerateClick = () => {
    if (!selectedImage) {
      // You might want to use a Toast or Banner for errors in a real app
      alert('Please select or upload an image first.');
      return;
    }
    if (!stickerPrompt.trim()) {
      alert('Please enter a description for your background.');
      return;
    }
    onGenerate(selectedImage, stickerPrompt);
  };

  return (
    // The screenshot shows a dark card. Polaris Card respects the theme.
    // Forcing a dark card on a potentially light theme might require Box with background props or custom CSS.
    // Here we use a standard Card.
    <Card>
      <Box padding="600"> {/* Added padding for inner content */}
        <BlockStack gap="500" inlineAlign="center">
          <ShinySticker
            url="https://i.imgur.com/XDIVOSU.png"
            width="200px"
            rotate="0deg"
          />
          <Text variant="headingLg" as="h2">
            Start generating
          </Text>
          <Text variant="bodyMd" as="p" tone="subdued" alignment="center">
            Upload a product image or select one from your catalog to generate AI-designed backgrounds.
          </Text>

          <InlineStack gap="300" align="center">
            <Button onClick={handleSimulateImageSelection} icon={UploadIcon}>
              Upload image
            </Button>
            <Button onClick={handleSimulateImageSelection} icon={ProductIcon} variant="secondary">
              Select a product
            </Button>
          </InlineStack>

          {selectedImage && (
            <Box paddingBlockStart="400" paddingBlockEnd="200" >
              <BlockStack gap="100" align="center">
                <Text variant="bodySm" as="p" tone="subdued">Image selected:</Text>
                <Thumbnail source={selectedImage} alt="Selected product" size="large" />
              </BlockStack>
            </Box>
          )}

          <Box paddingBlockStart="200" width="100%">
            <TextField
              label="Describe your product's desired background"
              value={stickerPrompt}
              onChange={handlePromptChange}
              placeholder="e.g., on a sunlit beach, in a modern kitchen, surrounded by autumn leaves"
              autoComplete="off"
              multiline={3}
              helpText="This description will guide the AI in creating the background."
            />
          </Box>

          <Box  paddingBlockStart="300">
            <Button
              variant="primary"
              size="large"
              onClick={handleGenerateClick}
              disabled={ !stickerPrompt.trim()}
            >
              Generate Backgrounds
            </Button>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}