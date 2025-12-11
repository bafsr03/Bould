import React, { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  CalloutCard,
  InlineGrid,
  Box,
  Link,
  Card,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import LibraryTable from "./converterComponents/LibraryTable";
import Previewer from "./converterComponents/PreviewerPanel";
import type { Props as PreviewerProps } from "./converterComponents/PreviewerPanel";
import ProductDetails from "./converterComponents/ProductDetails";

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { BillingPlanId } from "../billing/plans";
import { getPlanForShop } from "../billing/plan.server";
import {
  getApparelPreviewUsage,
  type ApparelPreviewUsage,
  isApparelPreviewLimitExceeded,
} from "../billing/usage.server";

type ConversionStatus = "pending" | "processing" | "completed" | "failed" | "deactivated";

type ShopifyProduct = {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  imageUrl: string | null;
};

type ConversionState = {
  status: ConversionStatus;
  processed: boolean;
  previewImageUrl?: string | null;
  sizeScaleUrl?: string | null;
  categoryId?: number | null;
  trueSize?: string | null;
  unit?: string | null;
  trueWaist?: string | null;
  tone?: string | null;
  deactivated?: boolean;
};

type LoaderData = {
  products: ShopifyProduct[];
  states: Record<string, ConversionState>; // keyed by product id
  plan: {
    id: BillingPlanId;
    name: string;
    apparelPreviewLimit: number | null;
    apparelPreviewLimitExceeded: boolean;
  };
  apparelUsage: ApparelPreviewUsage;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, billing, session } = await authenticate.admin(request);
  const shopDomain = session?.shop ?? null;

  const resp = await admin.graphql(
    `#graphql
      query ConverterProductsQuery {
        products(first: 30, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            title
            productType
            vendor
            status
            featuredImage { url altText }
            images(first: 1) { edges { node { url altText } } }
          }
        }
      }
    `
  );

  const data = await resp.json();
  const nodes = data?.data?.products?.nodes ?? [];
  const products: ShopifyProduct[] = nodes.map((n: any) => {
    const fallback = n.images?.edges?.[0]?.node?.url ?? null;
    const imageUrl = n.featuredImage?.url ?? fallback ?? null;
    return {
      id: n.id,
      title: n.title,
      productType: n.productType ?? "-",
      vendor: n.vendor ?? "-",
      status: n.status ?? "-",
      imageUrl,
    };
  });

  const existing = await (prisma as any).conversion.findMany({ where: { shopifyProductId: { in: products.map(p => p.id) } } });
  const states: LoaderData["states"] = {};
  for (const p of products) {
    const rec = existing.find((row: any) => row.shopifyProductId === p.id);
    states[p.id] = rec
      ? {
        status: rec.status as ConversionStatus,
        processed: rec.processed,
        previewImageUrl: rec.previewImageUrl,
        sizeScaleUrl: rec.sizeScaleUrl,
        categoryId: rec.categoryId ?? null,
        trueSize: rec.trueSize ?? null,
        unit: rec.unit ?? null,
        trueWaist: rec.trueWaist ?? null,
        tone: rec.tone ?? null,
      }
      : {
        status: "pending",
        processed: false,
        categoryId: null,
        trueSize: null,
        unit: null,
        trueWaist: null,
        tone: null,
      };
  }

  const planContext = await getPlanForShop({ billing, shopDomain });
  const apparelUsage = await getApparelPreviewUsage(shopDomain, {
    windowMinutes: planContext.plan.capabilities.apparelPreviewResetMinutes ?? undefined,
  });
  const apparelLimitExceeded = isApparelPreviewLimitExceeded(
    planContext.plan,
    apparelUsage
  );

  if (apparelLimitExceeded) {
    for (const key of Object.keys(states)) {
      const current = states[key];
      states[key] = {
        ...current,
        status: "deactivated",
        processed: false,
        deactivated: true,
      };
    }
  }

  return json<LoaderData>({
    products,
    states,
    plan: {
      id: planContext.planId,
      name: planContext.plan.name,
      apparelPreviewLimit: planContext.plan.capabilities.apparelPreviewLimit ?? null,
      apparelPreviewLimitExceeded: apparelLimitExceeded,
    },
    apparelUsage,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  const { billing, session } = await authenticate.admin(request);
  const shopDomain = session?.shop ?? null;

  if (intent !== "delete") {
    const planContext = await getPlanForShop({ billing, shopDomain });
    const apparelUsage = await getApparelPreviewUsage(shopDomain, {
      windowMinutes: planContext.plan.capabilities.apparelPreviewResetMinutes ?? undefined,
    });
    const apparelLimitExceeded = isApparelPreviewLimitExceeded(
      planContext.plan,
      apparelUsage
    );

    if (apparelLimitExceeded) {
      return json(
        {
          error:
            "Apparel previews limit exceeded for your current plan. Upgrade to resume garment conversions.",
        },
        { status: 403 }
      );
    }
  }

  if (intent === "convert") {
    const productId = String(formData.get("productId") || "");
    const productTitle = String(formData.get("title") || "");
    const imageUrl = String(formData.get("imageUrl") || "");
    const trueSize = String(formData.get("true_size") || "M");
    const categoryId = String(formData.get("category_id") || "1");
    const trueWaist = String(formData.get("true_waist") || "50");
    const tone = String(formData.get("tone") || "");
    const unit = String(formData.get("unit") || "cm");

    console.log(`[CONVERTER] Starting conversion for product: ${productTitle} (${productId})`);
    console.log(`[CONVERTER] Parameters:`, { trueSize, categoryId, trueWaist, unit, imageUrl });

    // Replace upsert with findFirst + update/create to work even if unique index is missing
    const existing = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
    if (existing) {
      console.log(`[CONVERTER] Updating existing conversion record: ${existing.id}`);
      await (prisma as any).conversion.update({
        where: { id: existing.id },
        data: {
          status: "processing",
          processed: false,
          title: productTitle,
          imageUrl,
          categoryId: parseInt(categoryId, 10),
          trueSize,
          unit,
          trueWaist,
          tone,
          shopDomain: shopDomain ?? existing.shopDomain ?? null,
        },
      });
    } else {
      console.log(`[CONVERTER] Creating new conversion record for product: ${productId}`);
      await (prisma as any).conversion.create({
        data: {
          shopifyProductId: productId,
          title: productTitle,
          imageUrl,
          categoryId: parseInt(categoryId, 10),
          trueSize,
          unit,
          trueWaist,
          tone,
          status: "processing",
          processed: false,
          shopDomain: shopDomain ?? null,
        },
      });
    }

    // Special handling for "One Size Fits All" (Category 99)
    if (categoryId === "99") {
      console.log(`[CONVERTER] One Size Fits All category selected. Skipping processing.`);
      const after = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
      
      if (after) {
        await (prisma as any).conversion.update({
          where: { id: after.id },
          data: {
            status: "completed",
            processed: true,
            previewImageUrl: null,
            sizeScaleUrl: null,
            categoryId: 99,
          },
        });
      }

      return json({
        success: true,
        productId,
        conversion: {
          status: "completed",
          processed: true,
          previewImageUrl: null,
          sizeScaleUrl: null,
          categoryId: 99,
          trueSize,
          unit,
          trueWaist,
          tone,
        }
      });
    }

    try {
      console.log(`[CONVERTER] Preparing image for processing...`);

      // Download image bytes
      const overrideImage = formData.get("override_image");
      let blobToSend: Blob | null = null;
      if (overrideImage && overrideImage instanceof File) {
        console.log(`[CONVERTER] Using override image file: ${overrideImage.name} (${overrideImage.size} bytes)`);
        blobToSend = overrideImage;
      } else {
        console.log(`[CONVERTER] Downloading image from: ${imageUrl}`);
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
          throw new Error(`Failed to download image: ${imgRes.status} ${imgRes.statusText}`);
        }
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const arrayBuf = await imgRes.arrayBuffer();
        blobToSend = new Blob([Buffer.from(arrayBuf)], { type: contentType });
        console.log(`[CONVERTER] Downloaded image: ${arrayBuf.byteLength} bytes, type: ${contentType}`);
      }

      const baseUrl = process.env.GARMENTS_API_URL || "http://localhost:8001";
      console.log(`[CONVERTER] Using API base URL: ${baseUrl}`);

      console.log(`[CONVERTER] Getting API token...`);
      const tokenRes = await fetch(`${baseUrl}/v1/auth/token`, { method: "POST" });
      if (!tokenRes.ok) {
        throw new Error(`Failed to get API token: ${tokenRes.status} ${tokenRes.statusText}`);
      }
      const tokenJson = await tokenRes.json();
      const token = tokenJson.token as string;
      console.log(`[CONVERTER] Got API token successfully`);

      const fd = new FormData();
      if (blobToSend) fd.append("image", blobToSend, `${productTitle || "garment"}.jpg`);
      fd.append("category_id", categoryId);
      fd.append("true_size", trueSize);
      fd.append("true_size", trueSize);
      fd.append("true_waist", trueWaist);
      if (tone) fd.append("tone", tone);
      fd.append("unit", unit);

      console.log(`[CONVERTER] Sending processing request to API...`);
      console.log(`[CONVERTER] Form data:`, {
        image: blobToSend ? `${blobToSend.size} bytes` : 'none',
        category_id: categoryId,
        true_size: trueSize,
        true_waist: trueWaist,
        unit: unit
      });

      const processRes = await fetch(`${baseUrl}/v1/process`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      console.log(`[CONVERTER] Processing response status: ${processRes.status}`);

      if (!processRes.ok) {
        const errorText = await processRes.text();
        console.error(`[CONVERTER] Process failed: ${processRes.status} ${processRes.statusText}`);
        console.error(`[CONVERTER] Error response:`, errorText);
        throw new Error(`Process failed: ${processRes.status} - ${errorText}`);
      }

      const result = await processRes.json();
      console.log(`[CONVERTER] Processing completed successfully:`, result);

      const measurementVisPath = result?.measurement_vis as string | undefined;
      const sizeScalePath = result?.size_scale as string | undefined;
      const previewProxyUrl = measurementVisPath ? `/app/converter/file?path=${encodeURIComponent(measurementVisPath)}` : null;
      const sizeScaleProxyUrl = sizeScalePath ? `/app/converter/file?path=${encodeURIComponent(sizeScalePath)}` : null;

      console.log(`[CONVERTER] Generated URLs:`, {
        measurementVisPath,
        sizeScalePath,
        previewProxyUrl,
        sizeScaleProxyUrl
      });

      const after = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
      let updatedRecord = after ?? null;
      if (after) {
        console.log(`[CONVERTER] Updating conversion record with results:`, {
          status: "completed",
          processed: true,
          previewImageUrl: previewProxyUrl,
          sizeScaleUrl: sizeScaleProxyUrl
        });
        updatedRecord = await (prisma as any).conversion.update({
          where: { id: after.id },
          data: { status: "completed", processed: true, previewImageUrl: previewProxyUrl ?? undefined, sizeScaleUrl: sizeScaleProxyUrl ?? undefined },
        });
        console.log(`[CONVERTER] Conversion completed successfully for product: ${productTitle}`);
      }

      const updatedCategoryId = updatedRecord?.categoryId ?? (Number.isFinite(parseInt(categoryId, 10)) ? parseInt(categoryId, 10) : null);
      const updatedTrueSize = updatedRecord?.trueSize ?? trueSize;
      const updatedUnit = updatedRecord?.unit ?? unit;
      const updatedTrueWaist = updatedRecord?.trueWaist ?? trueWaist;
      const updatedTone = updatedRecord?.tone ?? tone;

      return json({
        success: true,
        productId,
        conversion: {
          status: "completed",
          processed: true,
          previewImageUrl: previewProxyUrl,
          sizeScaleUrl: sizeScaleProxyUrl,
          categoryId: updatedCategoryId,
          trueSize: updatedTrueSize,
          unit: updatedUnit,
          trueWaist: updatedTrueWaist,
          tone: updatedTone,
        }
      });
    } catch (err) {
      console.error(`[CONVERTER] Conversion failed for product ${productTitle}:`, err);
      const errorMessage = err instanceof Error ? err.message : "Conversion failed";
      const after = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
      if (after) {
        console.log(`[CONVERTER] Updating conversion record to failed status`);
        const updated = await (prisma as any).conversion.update({
          where: { id: after.id },
          data: { status: "failed", processed: false },
        });
        return json({
          success: false,
          productId,
          error: errorMessage,
          conversion: {
            status: "failed",
            processed: false,
            previewImageUrl: null,
            sizeScaleUrl: null,
            categoryId: updated?.categoryId ?? null,
            trueSize: updated?.trueSize ?? null,
            unit: updated?.unit ?? null,
            trueWaist: updated?.trueWaist ?? null,
            tone: updated?.tone ?? null,
          },
        });
      }
      return json({
        success: false,
        productId,
        error: errorMessage,
        conversion: {
          status: "failed",
          processed: false,
          previewImageUrl: null,
          sizeScaleUrl: null,
          categoryId: Number.isFinite(parseInt(categoryId, 10)) ? parseInt(categoryId, 10) : null,
          trueSize,
          unit,
          trueWaist,
          tone,
        }
      });
    }
  }

  if (intent === "delete") {
    const productId = String(formData.get("productId") || "");
    const rec = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
    if (rec) {
      const updated = await (prisma as any).conversion.update({
        where: { id: rec.id },
        data: { status: "pending", processed: false, previewImageUrl: null, sizeScaleUrl: null },
      });
      return json({
        success: true,
        productId,
        conversion: {
          status: "pending",
          processed: false,
          previewImageUrl: null,
          sizeScaleUrl: null,
          categoryId: updated?.categoryId ?? null,
          trueSize: updated?.trueSize ?? null,
          unit: updated?.unit ?? null,
          trueWaist: updated?.trueWaist ?? null,
          tone: updated?.tone ?? null,
        }
      });
    }
    return json({
      success: true,
      productId,
      conversion: {
        status: "pending",
        processed: false,
        previewImageUrl: null,
        sizeScaleUrl: null,
        categoryId: null,
        trueSize: null,
        unit: null,
        trueWaist: null,
        tone: null,
      }
    });
  }

  if (intent === "apply_tone_to_all") {
    const tone = String(formData.get("tone") || "");
    console.log(`[CONVERTER] Applying tone to all products for shop ${shopDomain}: ${tone}`);

    if (shopDomain) {
      await (prisma as any).conversion.updateMany({
        where: { shopDomain },
        data: { tone }
      });
      return json({ success: true, appliedTone: tone });
    }
    return json({ error: "Shop domain not found" }, { status: 400 });
  }

  return json({ ok: true });
};

export default function ConverterPage() {
  const { products, states, plan, apparelUsage } = useLoaderData<LoaderData>();
  const [selected, setSelected] = useState<ShopifyProduct | null>(null);
  const [conversionStates, setConversionStates] = useState<Record<string, ConversionState>>(states);

  useEffect(() => {
    setConversionStates(states);
  }, [states]);

  const handleConversionUpdate = useCallback(
    (productId: string, conversionData: Partial<ConversionState>) => {
      setConversionStates((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          ...conversionData,
        },
      }));
    },
    []
  );

  const conversionDisabled = plan.apparelPreviewLimitExceeded;
  const conversionDisabledMessage =
    conversionDisabled && plan.apparelPreviewLimit
      ? `The ${plan.name} plan allows ${plan.apparelPreviewLimit} apparel previews. You have recorded ${apparelUsage.total}. Upgrade your plan to continue converting garments.`
      : "Upgrade your plan to continue converting garments.";

  return (
    <Page>
      <TitleBar title="Bould Converter" />

      <Layout>
        <Layout.Section>
          <Box>
            <CalloutCard
              title="Watch the Steps to Process any Garment"
              illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart.svg"
              primaryAction={{ content: "Upload" }}
              secondaryAction={{ content: "Watch Tutorial" }}
            >
              <p>
                To upload your design, drag and drop into the drop zone or click &quot;Upload.&quot;
              </p>
            </CalloutCard>
          </Box>

          {conversionDisabled && (
            <Box paddingBlockStart="400">
              <Banner tone="critical" title="Garments paused">
                <p>{conversionDisabledMessage}</p>
                <Link url="/app/pricing">Upgrade plan</Link>
              </Banner>
            </Box>
          )}

          <Box paddingBlockStart="400">
            <Layout>
              <Layout.Section>
                <Card>
                  <Box padding="400">
                    <ProductDetails
                      selected={selected}
                      status={selected ? conversionStates[selected.id] : undefined}
                      onConversionUpdate={handleConversionUpdate}
                      conversionDisabled={conversionDisabled}
                      disabledMessage={conversionDisabledMessage}
                      isPro={plan.id === "pro"}
                    />
                  </Box>
                </Card>
              </Layout.Section>

              <Layout.Section>
                {(() => {
                  const previewerProps: PreviewerProps = {
                    productId: selected?.id || null,
                    imageUrl: selected ? conversionStates[selected.id]?.previewImageUrl ?? null : null,
                    sizeScaleUrl: selected ? conversionStates[selected.id]?.sizeScaleUrl ?? null : null,
                    statusLabel: selected ? `${conversionStates[selected.id]?.status || "pending"}` : undefined,
                    onConversionUpdate: handleConversionUpdate,
                  };
                  return <Previewer {...previewerProps} />;
                })()}
              </Layout.Section>
            </Layout>
          </Box>

          <Box paddingBlockStart="600">
            <LibraryTable
              products={products}
              states={conversionStates}
              onSelect={setSelected}
              selectedProductId={selected?.id}
              conversionDisabled={conversionDisabled}
            />
          </Box>
        </Layout.Section>
      </Layout>

      <Box padding="500">
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
