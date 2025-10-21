import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  CalloutCard,
  InlineGrid,
  Box,
  Link,
  Card,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import DropZoneUploader from "./converterComponents/DropZoneUploader";
import LibraryTable from "./converterComponents/LibraryTable";
import Previewer from "./converterComponents/PreviewerPanel";
import ProductDetails from "./converterComponents/ProductDetails";

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type ConversionStatus = "pending" | "processing" | "completed" | "failed";

type ShopifyProduct = {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  imageUrl: string | null;
};

type LoaderData = {
  products: ShopifyProduct[];
  states: Record<string, { status: ConversionStatus; processed: boolean; previewImageUrl?: string | null; sizeScaleUrl?: string | null }>; // keyed by product id
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

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
      ? { status: rec.status as ConversionStatus, processed: rec.processed, previewImageUrl: rec.previewImageUrl, sizeScaleUrl: rec.sizeScaleUrl }
      : { status: "pending", processed: false };
  }

  return json<LoaderData>({ products, states });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "convert") {
    const productId = String(formData.get("productId") || "");
    const productTitle = String(formData.get("title") || "");
    const imageUrl = String(formData.get("imageUrl") || "");
    const trueSize = String(formData.get("true_size") || "M");
    const categoryId = String(formData.get("category_id") || "1");
    const trueWaist = String(formData.get("true_waist") || "50");
    const unit = String(formData.get("unit") || "cm");

    // Replace upsert with findFirst + update/create to work even if unique index is missing
    const existing = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
    if (existing) {
      await (prisma as any).conversion.update({
        where: { id: existing.id },
        data: { status: "processing", processed: false, title: productTitle, imageUrl, categoryId: parseInt(categoryId, 10), trueSize, unit, trueWaist },
      });
    } else {
      await (prisma as any).conversion.create({
        data: { shopifyProductId: productId, title: productTitle, imageUrl, categoryId: parseInt(categoryId, 10), trueSize, unit, trueWaist, status: "processing", processed: false },
      });
    }

    try {
      // Download image bytes
      const overrideImage = formData.get("override_image");
      let blobToSend: Blob | null = null;
      if (overrideImage && overrideImage instanceof File) {
        blobToSend = overrideImage;
      } else {
        const imgRes = await fetch(imageUrl);
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const arrayBuf = await imgRes.arrayBuffer();
        blobToSend = new Blob([Buffer.from(arrayBuf)], { type: contentType });
      }

      const baseUrl = process.env.GARMENTS_API_URL || "http://localhost:8000";
      const tokenRes = await fetch(`${baseUrl}/v1/auth/token`, { method: "POST" });
      const tokenJson = await tokenRes.json();
      const token = tokenJson.token as string;

      const fd = new FormData();
      if (blobToSend) fd.append("image", blobToSend, `${productTitle || "garment"}.jpg`);
      fd.append("category_id", categoryId);
      fd.append("true_size", trueSize);
      fd.append("true_waist", trueWaist);
      fd.append("unit", unit);

      const processRes = await fetch(`${baseUrl}/v1/process`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!processRes.ok) {
        throw new Error(`Process failed: ${processRes.status}`);
      }

      const result = await processRes.json();
      const measurementVisPath = result?.measurement_vis as string | undefined;
      const sizeScalePath = result?.size_scale as string | undefined;
      const previewProxyUrl = measurementVisPath ? `/app/converter/file?path=${encodeURIComponent(measurementVisPath)}` : null;
      const sizeScaleProxyUrl = sizeScalePath ? `/app/converter/file?path=${encodeURIComponent(sizeScalePath)}` : null;

      const after = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
      if (after) {
        await (prisma as any).conversion.update({
          where: { id: after.id },
          data: { status: "completed", processed: true, previewImageUrl: previewProxyUrl ?? undefined, sizeScaleUrl: sizeScaleProxyUrl ?? undefined },
        });
      }
    } catch (err) {
      const after = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
      if (after) {
        await (prisma as any).conversion.update({ where: { id: after.id }, data: { status: "failed", processed: false } });
      }
    }

    return redirect("/app/converter");
  }

  return json({ ok: true });
};

export default function ConverterPage() {
  const { products, states } = useLoaderData<LoaderData>();
  const [selected, setSelected] = useState<ShopifyProduct | null>(null);

  return (
    <Page>
      <TitleBar title="Bould" />

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
                To upload your design, drag and drop into the drop zone or click "Upload."
              </p>
            </CalloutCard>
          </Box>

          <Box paddingBlockStart="400">
            <InlineGrid
              columns={{ xs: "1fr", sm: ["twoThirds", "oneThird"] }}
              gap="400"
            >
              <Card>
                <Box padding="400">
                  <ProductDetails
                    selected={selected}
                    status={selected ? states[selected.id] : undefined as any}
                  />
                </Box>
              </Card>

              <Previewer imageUrl={selected ? (states[selected.id]?.previewImageUrl ?? null) : null} statusLabel={selected ? `${states[selected.id]?.status || 'pending'}` : undefined} />
            </InlineGrid>
          </Box>

          <Box paddingBlockStart="400">
            <Card>
              <Box padding="400">
                <DropZoneUploader />
              </Box>
            </Card>
          </Box>

          <Box paddingBlockStart="600">
            <LibraryTable products={products} states={states} onSelect={setSelected} selectedProductId={selected?.id} />
          </Box>
        </Layout.Section>
      </Layout>

      <Box padding="500">
        <div style={{ textAlign: "center" }}>
          <Text as="h4" tone="subdued">
            Need help?{" "}
            <Link url="mailto:jake@bouldhq.com" removeUnderline>
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
