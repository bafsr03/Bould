import {useState, useCallback, useRef, useEffect} from 'react';
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
  LegacyCard,
  SkeletonTabs,
  Link,
  DropZone,
  LegacyStack,
} from '@shopify/polaris';
import {NoteIcon} from '@shopify/polaris-icons';

function DropZoneExample() {
  const [files, setFiles] = useState<File[]>([]);

  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], _rejectedFiles: File[]) =>
      setFiles((prev) => [...prev, ...acceptedFiles]),
    [],
  );

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

  const fileUpload = !files.length && (
    <DropZone.FileUpload actionHint="Accepts .gif, .jpg, and .png" />
  );

  const uploadedFiles = files.length > 0 && (
    <LegacyStack vertical>
      {files.map((file, index) => (
        <LegacyStack alignment="center" key={index}>
          <Thumbnail
            size="small"
            alt={file.name}
            source={
              validImageTypes.includes(file.type)
                ? window.URL.createObjectURL(file)
                : NoteIcon
            }
          />
          <div>
            {file.name}{' '}
            <Text variant="bodySm" as="p">
              {file.size} bytes
            </Text>
          </div>
        </LegacyStack>
      ))}
    </LegacyStack>
  );

  return (
    <DropZone onDrop={handleDropZoneDrop} variableHeight>
      {uploadedFiles}
      {fileUpload}
    </DropZone>
  );
}


interface GenerationControlsProps {
  productImage: string;
  initialDescriptionFromPrompt?: string;
  onGenerateImages: (numberOfImages: number) => void;
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

  // Ref for the generator tab's content area
  const generatorContentRef = useRef<HTMLDivElement>(null);
  // State to store the calculated height
  const [myStickerTabMinHeight, setMyStickerTabMinHeight] = useState<number | string>('auto');

  const handleTabChange = useCallback((idx: number) => setSelectedTabIndex(idx), []);
  const handleDescriptionChange = useCallback((val: string) => setDescription(val), []);

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
        'Saving Stickers and creating sticker packs (coming soon)',
    },
  ];

  // Effect to update the height when the generator tab is visible 
  useEffect(() => {
    if (selectedTabIndex === 0 && generatorContentRef.current) {
      const currentHeight = generatorContentRef.current.offsetHeight;
      //  update if the height is different and positive to avoid unnecessary re-renders
      if (currentHeight > 0 && myStickerTabMinHeight !== currentHeight) {
        setMyStickerTabMinHeight(currentHeight);
      }
    }
    // Dependencies:
    // - selectedTabIndex: to re-measure when Generator tab becomes active.
    // - productImage, description: if these change, Generator tab height might change.
    // - files from DropZoneExample also affects height, but this effect will capture
    //   the new offsetHeight when generatorContentRef.current is available.
  }, [selectedTabIndex, productImage, description, myStickerTabMinHeight]);


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

  return (
    <Card>
      <Tabs selected={selectedTabIndex} onSelect={handleTabChange} tabs={tabs} fitted>
        <Box padding="400">
          {selectedTabIndex === 0 && (
            <div ref={generatorContentRef}>
              <BlockStack gap="600">
                {/* Sticker Preview */}
                <div>
                  <Text variant="bodyMd" as="h3" fontWeight="semibold">
                    View Sticker Preview
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
                          transition: 'padding 0.1s ease-out',
                        }}
                      />
                    </div>
                  </div>
                  <Box paddingBlockStart="200" />
                </div>

                {/* Background Description + DropZone */}
                <div>
                  <Text variant="bodyMd" as="h3" fontWeight="semibold">
                    Background Description
                  </Text>
                  <Box paddingBlockStart="100" />
                  <TextField
                    label="Background description"
                    labelHidden
                    value={description}
                    onChange={handleDescriptionChange}
                    multiline={2}
                    maxLength={250}
                    showCharacterCount
                    autoComplete="off"
                    placeholder="e.g., A sun-drenched wooden table with blurred cafe background"
                  />
                  <Box paddingBlockStart="200" />
                  <DropZoneExample />
                </div>

                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  onClick={() => onGenerateImages(numImagesToGenerate)}
                >
                  Generate images
                </Button>
              </BlockStack>
            </div>
          )}

          {selectedTabIndex === 1 && (
            <div
              style={{
                minHeight: myStickerTabMinHeight,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <BlockStack
                gap="400"
                align="center"
              >
                <Text variant="headingMd" as="h3">
                  Sticker packs
                </Text>
                <Banner onDismiss={() => {}}>
                  <p>
                    Saving Stickers and creating sticker packs (coming soon){' '}
                    <Link url="">Let us know what you want to see</Link>
                  </p>
                </Banner>
                <LegacyCard>
                  <SkeletonTabs fitted />
                </LegacyCard>
              </BlockStack>
            </div>
          )}
        </Box>
      </Tabs>
    </Card>
  );
}