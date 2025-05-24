import { useState, useCallback, useRef } from "react"; // Added useRef
import {
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  TextField,
  Box,
  Thumbnail,
} from "@shopify/polaris";
import { ProductIcon, UploadIcon } from "@shopify/polaris-icons";
import { ShinySticker } from "./ShinySticker";

// Placeholder "Select a product" demonstration
const DEFAULT_PRODUCT_IMAGE_UPLOADED =
  "https://burst.shopifycdn.com/photos/orange-leather-cap-with-white-letter-c.jpg?width=373&format=pjpg&exif=0&iptc=0";

interface InitialStickerGenerationProps {
  onGenerate: (image: string, prompt: string) => void;
}

export function InitialStickerGeneration({
  onGenerate,
}: InitialStickerGenerationProps) {
  const [stickerPrompt, setStickerPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePromptChange = useCallback(
    (value: string) => setStickerPrompt(value),
    [],
  );

  /* Selection Logic  */
  const handleSelectProductClick = () => {
    setSelectedImage(DEFAULT_PRODUCT_IMAGE_UPLOADED);
  };

  const handleUploadImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string); // Set the image as a base64 data URL
      };
      reader.onerror = () => {
        console.error("Error reading file.");
        alert("There was an error uploading your image. Please try again.");
        setSelectedImage(null);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
    }
    // Reset the file input's value to allow selecting the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleGenerateClick = () => {
    if (!selectedImage) {
      alert("Please select or upload an image first.");
      return;
    }
    if (!stickerPrompt.trim()) {
      alert("Please enter a description for your background.");
      return;
    }
    onGenerate(selectedImage, stickerPrompt);
  };

  return (
    <Card>
      <Box padding="600">
        {" "}
        {/* Added padding for inner content */}
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
            Upload a product image or select one from your catalog to generate
            AI-designed backgrounds.
          </Text>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileSelected}
          />

          <InlineStack gap="300" align="center">
            <Button onClick={handleUploadImageButtonClick} icon={UploadIcon}>
              Upload image
            </Button>
            <Button
              onClick={handleSelectProductClick}
              icon={ProductIcon}
              variant="secondary"
            >
              Select a product
            </Button>
          </InlineStack>

          {selectedImage && (
            <Box paddingBlockStart="400" paddingBlockEnd="200">
              <BlockStack gap="100" align="center">
                <Text variant="bodySm" as="p" tone="subdued">
                  Image selected:
                </Text>
                <Thumbnail
                  source={selectedImage}
                  alt="Selected product"
                  size="large"
                />
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

          <Box paddingBlockStart="300">
            <Button
              variant="primary"
              size="large"
              onClick={handleGenerateClick}
              disabled={!selectedImage || !stickerPrompt.trim()} // Disable if no image or prompt
            >
              Generate Backgrounds
            </Button>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}
