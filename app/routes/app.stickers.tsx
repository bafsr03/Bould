// app/routes/stickerspage.tsx
import { useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Box,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';

// Import your modular components
import { InitialStickerGeneration } from './stickerComponents/InitialStickerGeneration';
import { GenerationControls }           from './stickerComponents/GenerationControls';
import { ImagePreview }                 from './stickerComponents/ImagePreview';
import { StickerSettings }              from './stickerComponents/StickerSettings';

// A default product photo if none has been selected yet
const DEFAULT_PRODUCT_IMAGE =
  'https://burst.shopifycdn.com/phot...c.jpg?width=373&format=pjpg&exif=0&iptc=0';


export default function StickersPage() {
  const [currentView, setCurrentView]         = useState<'initial' | 'generation'>('initial');
  const [productImage, setProductImage]       = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt]     = useState<string>('');
  const [freeImagesLeft, setFreeImagesLeft]   = useState<number>(4);

  // New sticker‐settings state
  const [imageScale, setImageScale]           = useState<number>(100);
  const [morphologyPadding, setMorphologyPadding] = useState<number>(0);
  const [stickerFinish, setStickerFinish]     = useState<string>('Matte');
  const [stickerOverlay, setStickerOverlay]   = useState<string>('None');

  const handleGoToGenerationView = useCallback(
    (image: string, prompt: string) => {
      setProductImage(image);
      setInitialPrompt(prompt);
      setCurrentView('generation');
    },
    []
  );

  const handleGoBackToInitialView = useCallback(() => {
    setCurrentView('initial');
    // If you want to clear selections on back, uncomment:
    // setProductImage(null);
    // setInitialPrompt('');
  }, []);

  const pageTitle = currentView === 'initial' ? 'Stickers' : 'Stickers';

  return (
    <Page
      title={pageTitle}
      backAction={
        currentView === 'generation'
          ? {
              content: 'Back to AI Photoshoots',
              onAction: handleGoBackToInitialView,
            }
          : undefined
      }
      secondaryActions={
        currentView === 'generation'
          ? [{ content: `Free images left ${freeImagesLeft}/4`, disabled: true }]
          : []
      }
    >
      <TitleBar title="Bould" />

      {currentView === 'initial' ? (
        <>
          <BlockStack gap="400">
            <Text variant="headingXl" as="h1">
              Bould
            </Text>
            <Text variant="bodyLg" as="p" tone="subdued">
              Create stunning images and marketing content from plain product photos.
            </Text>
          </BlockStack>

          <Box paddingBlockStart="800" />
          <InitialStickerGeneration onGenerate={handleGoToGenerationView} />
        </>
      ) : (
        <Layout>
          {/* Preview + Sticker Settings */}
          <Layout.Section >
                        <GenerationControls
              productImage={productImage || DEFAULT_PRODUCT_IMAGE}
              initialDescriptionFromPrompt={initialPrompt}
              onGenerateImages={(count) => {
                console.log(`Generating ${count} images…`);
                if (freeImagesLeft >= count) {
                  setFreeImagesLeft(freeImagesLeft - count);
                }
              }}
            />

          </Layout.Section>

          {/* Generation controls */}
          <Layout.Section variant="oneThird">
            <ImagePreview
              productImage={productImage || DEFAULT_PRODUCT_IMAGE}

            />
            <Box paddingBlockStart="400" />
            <StickerSettings
              imageScale={imageScale}
              onScaleChange={setImageScale}
              morphologyPadding={morphologyPadding}
              onPaddingChange={setMorphologyPadding}
              stickerFinish={stickerFinish}
              onFinishChange={setStickerFinish}
              stickerOverlay={stickerOverlay}
              onOverlayChange={setStickerOverlay}
            />
          </Layout.Section>
        </Layout>
      )}
    </Page>
  );
}
