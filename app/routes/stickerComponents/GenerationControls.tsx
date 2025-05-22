// app/components/GenerationControls.tsx
import { useState, useCallback } from 'react';
import {
  Card,
  Tabs,
  BlockStack,
  Text,
  TextField,
  Button,
  Box,
  Thumbnail,
  Banner,
  InlineStack,
  DropZone,
} from '@shopify/polaris';
import { ImageIcon, XCircleIcon, UploadIcon } from '@shopify/polaris-icons';

interface GenerationControlsProps {
  productImage: string;
  initialDescriptionFromPrompt?: string;
  onGenerateImages: (
    numberOfImages: number,
    referenceImageFile?: File // Optional reference image
  ) => void;
}

export function GenerationControls({
  productImage,
  initialDescriptionFromPrompt,
  onGenerateImages,
}: GenerationControlsProps) {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [description, setDescription] = useState(
    initialDescriptionFromPrompt ||
      'Professional photo of an object on a clean marble surface, studio lighting, vibrant backdrop.',
  );
  const [numImagesToGenerate] = useState<number>(4);
  const [imageScale] = useState<number>(60);
  const [morphologyPadding] = useState<number>(0);

  const [uploadedReferenceFile, setUploadedReferenceFile] = useState<File | null>(null);
  const [fileRejectionError, setFileRejectionError] = useState<string | null>(null);
  const [isUploadingReference] = useState(false);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTabIndex(selectedTabIndex),
    [],
  );

  const handleDescriptionChange = useCallback(
    (value: string) => setDescription(value),
    [],
  );

  // Handle file upload
  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], rejectedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        setUploadedReferenceFile(acceptedFiles[0]);
        setFileRejectionError(null);
      } else if (rejectedFiles && rejectedFiles.length > 0) {
        setFileRejectionError('File type not supported or file too large.');
      }
    },
    [],
  );

  const tabs = [
    {
      id: 'text-prompt',
      content: 'Generator',
      accessibilityLabel: 'Generate background from text prompt',
    },
    {
      id: 'template-prompt',
      content: 'MySticker',
      accessibilityLabel:
        'Generate background from template (coming soon)',
    },
  ];

  const checkeredBgStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    width: '100%',
    minHeight: '250px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--p-border-radius-200)',
    border: '1px dashed var(--p-color-border-interactive)',
    overflow: 'hidden',
    position: 'relative',
  };

  const unscaledImageMaxPreviewSize = '250px';

  const fileRejectionMarkup = fileRejectionError && (
    <Box paddingBlockStart="100" paddingBlockEnd="0">
      <Banner
        title="Reference image error"
        tone="critical"
        onDismiss={() => setFileRejectionError(null)}
      >
        <p>{fileRejectionError}</p>
      </Banner>
    </Box>
  );

  // Content for the DropZone when no file is selected, or to change it
  const dropZoneButtonActivator = (
    <Button
      icon={uploadedReferenceFile ? ImageIcon : UploadIcon}
      size="slim"
      disabled={isUploadingReference}
      loading={isUploadingReference}
    >
    </Button>
  );

  // Preview for the uploaded file, shown instead of the "Add Ref" button
  const uploadedFilePreviewMarkup = uploadedReferenceFile && !isUploadingReference && (
    <InlineStack gap="100" blockAlign="center" wrap={false}>
      <Thumbnail
        size="extraSmall"
        alt={uploadedReferenceFile.name}
        source={URL.createObjectURL(uploadedReferenceFile)}
      />
      <Text variant="bodySm" as="span" truncate>
        {uploadedReferenceFile.name.length > 15
          ? uploadedReferenceFile.name.substring(0, 12) + '...'
          : uploadedReferenceFile.name}
      </Text>
      <Button
        icon={XCircleIcon}
        onClick={() => {
          setUploadedReferenceFile(null);
          setFileRejectionError(null);
        }}
        accessibilityLabel="Remove reference image"
        size="slim"
      />
    </InlineStack>
  );

  return (
    <Card>
      <Tabs tabs={tabs} selected={selectedTabIndex} onSelect={handleTabChange} fitted>
        <Box padding="400">
          {selectedTabIndex === 0 && (
            <BlockStack gap="600">
              <div> {/* Step 1: Product Image Adjustments (Main Sticker) */}
                <Text variant="bodyMd" as="h3" fontWeight="semibold">
                  1. Adjust product image
                </Text>
                <Box paddingBlockStart="200" />
                <div style={checkeredBgStyle}>
                  <div
                    style={{
                      display: 'inline-block',
                      transform: `scale(${imageScale / 100})`,
                      transition: 'transform 0.1s ease-out',
                    }}
                  >
                    <img
                      src={productImage}
                      alt="Product to edit"
                      style={{
                        display: 'block',
                        maxWidth: unscaledImageMaxPreviewSize,
                        maxHeight: unscaledImageMaxPreviewSize,
                        objectFit: 'contain',
                        padding: `${morphologyPadding}px`,
                        boxSizing: 'border-box',
                        backgroundColor: 'transparent',
                        transition: 'padding 0.1s ease-out',
                      }}
                    />
                  </div>
                </div>
                <Box paddingBlockStart="200" />
              </div>

              {/* Step 2: Reference Image Upload */}
              <div>
                {fileRejectionMarkup}
                <Box paddingBlockStart={fileRejectionMarkup ? "100" : "200"} />
                <Text variant="bodyMd" as="h3" fontWeight="semibold">
                  2. (Optional) Add reference image
                </Text>
                <Box paddingBlockStart="100" />
                <DropZone
                  allowMultiple={false}
                  onDrop={handleDropZoneDrop}
                  accept="image/*"
                  disabled={isUploadingReference}
                  outline
                >
                  {uploadedFilePreviewMarkup || dropZoneButtonActivator}
                </DropZone>
              </div>

              {/* Step 3: Describe Background */}
              <div>
                <Box paddingBlockStart="200" />
                <TextField
                  label="Background Description"
                  labelHidden
                  value={description}
                  onChange={handleDescriptionChange}
                  multiline={4}
                  maxLength={250}
                  showCharacterCount
                  autoComplete="off"
                  placeholder="e.g., A sun-drenched wooden table with blurred cafe background"
                />
              </div>

              <Button
                variant="primary"
                size="large"
                fullWidth
                onClick={() =>
                  onGenerateImages(
                    numImagesToGenerate,
                    uploadedReferenceFile || undefined,
                  )
                }
              >
                Generate images
              </Button>
            </BlockStack>
          )}
          {selectedTabIndex === 1 && (
            <BlockStack gap="300" align="center">
              <Text variant="headingMd" as="h3">
                Template Selection
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Choosing from pre-designed templates is coming soon!
              </Text>
            </BlockStack>
          )}
        </Box>
      </Tabs>
    </Card>
  );
}