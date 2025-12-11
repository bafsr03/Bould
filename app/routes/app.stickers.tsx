import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Box,
  Link,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { InitialStickerGeneration } from "./stickerComponents/InitialStickerGeneration";
import { GenerationControls } from "./stickerComponents/GenerationControls";
import { ImagePreview } from "./stickerComponents/ImagePreview";
import { StickerSettings } from "./stickerComponents/StickerSettings";
import OrderCard from "./stickerComponents/OrderCard";

const DEFAULT_PRODUCT_IMAGE =
  "https://i.imgur.com/p5eOV3L.png";
 
export default function StickersPage() {
  const [currentView, setCurrentView] = useState<"initial" | "generation">(
    "initial",
  );
  const [productImage, setProductImage] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [freeImagesLeft, setFreeImagesLeft] = useState<number>(4);

  const [imageScale, setImageScale] = useState<number>(100);
  const [morphologyPadding, setMorphologyPadding] = useState<number>(0);
  const [stickerFinish, setStickerFinish] = useState<string>("Matte"); // This could later influence ShinySticker appearance
  const [stickerOverlay, setStickerOverlay] = useState<string>("None");

  const handleGoToGenerationView = useCallback(
    (image: string, prompt: string) => {
      setProductImage(image);
      setInitialPrompt(prompt);
      setCurrentView("generation");
    },
    [],
  );

  const handleGoBackToInitialView = useCallback(() => {
    setCurrentView("initial");
    // setProductImage(null);
    // setInitialPrompt('');
  }, []);

  // For testing,  default image.
  // on app released, enforce image selection before reaching this view.
  const displayProductImage =
    productImage ||
    (currentView === "generation" ? DEFAULT_PRODUCT_IMAGE : null);

  return (
    <Page
      titleHidden
      backAction={
        currentView === "generation"
          ? {
              content: "Back to Generate Stickers",
              onAction: handleGoBackToInitialView,
            }
          : undefined
      }
      secondaryActions={
        currentView === "generation"
          ? [
              {
                content: `Free images left ${freeImagesLeft}/4`,
                disabled: true,
              },
            ]
          : []
      }
    >
      <TitleBar title="Bould" />
      {currentView === "initial" ? (
        <>
                  <Box paddingBlockStart="400" paddingBlockEnd="200">
            <Text variant="headingXl" as="h1">
              Stickers
            </Text>
          </Box>
          <BlockStack gap="400">
            <Text variant="bodyLg" as="p" tone="subdued">
              Create stunning images and marketing content from plain product
              photos.
            </Text>
          </BlockStack>

          <Box paddingBlockStart="800" />
          <InitialStickerGeneration onGenerate={handleGoToGenerationView} />
        </>
      ) : (
        <>


          <Box paddingBlockStart="400" paddingBlockEnd="200">
            <Text variant="headingXl" as="h1">
              Stickers
            </Text>
          </Box>
          <Banner title="Experimental mode" onDismiss={() => {}}>
            <p>
              Stickers is still in Beta testing; you can still Generate
              stickers below.
            </p>
          </Banner>
          <Box paddingBlockEnd="400" />

          <Layout>
            <Layout.Section>
              <GenerationControls
                productImage="https://i.imgur.com/p5eOV3L.png"
                initialDescriptionFromPrompt={initialPrompt}
                onGenerateImages={(count) => {
                  console.log(`Generating ${count} images…`);
                  if (freeImagesLeft >= count) {
                    setFreeImagesLeft(freeImagesLeft - count);
                  }
                }}
              />
              <Box paddingBlockStart="200">
                <OrderCard />
              </Box>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <ImagePreview
                productImage={displayProductImage || DEFAULT_PRODUCT_IMAGE}
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
        </>
      )}

      {/* Footer */}
      <Box padding="1000">
        <div style={{ textAlign: "center" }}>
          <Text as="h4" tone="subdued">
            Need help?{" "}
            <Link url="mailto:jake@bouldhq.com?subject=I have questions about the Bould app" removeUnderline target="_top">
              Chat with us.
            </Link>
          </Text>
          <Box paddingBlockStart="100">
            <Text as="h4" tone="subdued">
              © 2025 Bould
            </Text>
          </Box>
        </div>
      </Box>
    </Page>
  );
}
