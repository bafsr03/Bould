import { useState, useCallback, useEffect } from "react";
import {
  BlockStack,
  InlineStack,
  Divider,
  Button,
  Select,
  Text,
  TextField,
  Box,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import type { action as converterAction } from "../app.converter";


type ShopifyProduct = {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  imageUrl: string | null;
};

interface Props {
  selected?: ShopifyProduct | null;
  status?: {
    status: string;
    processed: boolean;
    previewImageUrl?: string | null;
    sizeScaleUrl?: string | null;
    categoryId?: number | null;
    trueSize?: string | null;
    unit?: string | null;
    trueWaist?: string | null;
  } | null;
  onConversionUpdate?: (productId: string, conversionData: any) => void;
}

export default function ControlsPanel({ selected, status, onConversionUpdate }: Props) {
  const convertFetcher = useFetcher<typeof converterAction>();
  const [selectedCategory, setSelectedCategory] = useState("1");
  const [trueSize, setTrueSize] = useState("M");
  const [unit, setUnit] = useState("cm");
  const [trueWaist, setTrueWaist] = useState("50");
  const [overrideFile, setOverrideFile] = useState<File | null>(null);
  const isConverting = convertFetcher.state !== "idle";

  // Handle conversion response
  useEffect(() => {
    const payload = convertFetcher.data;
    if (!payload || !onConversionUpdate) return;
    const { productId, conversion } = payload as any;
    if (!productId || !conversion) return;
    onConversionUpdate(productId, conversion);
  }, [convertFetcher.data, onConversionUpdate]);

  // DeepFashion2 categories 1..13 (simplified labels)
  const categoryOptions = [
    { label: "Short sleeve top (1)", value: "1" },
    { label: "Long sleeve top (2)", value: "2" },
    { label: "Short sleeve outwear (3)", value: "3" },
    { label: "Long sleeve outwear (4)", value: "4" },
    { label: "Vest (5)", value: "5" },
    { label: "Sling (6)", value: "6" },
    { label: "Shorts (7)", value: "7" },
    { label: "Trousers (8)", value: "8" },
    { label: "Skirt (9)", value: "9" },
    { label: "Short sleeve dress (10)", value: "10" },
    { label: "Long sleeve dress (11)", value: "11" },
    { label: "Vest dress (12)", value: "12" },
    { label: "Sling dress (13)", value: "13" },
  ];

  const sizeOptions = ["XXS","XS","S","M","L","XL","XXL","XXXL","ONEFIT"];

  const handleCategoryChange = useCallback((value: string) => setSelectedCategory(value), []);

  const handleConvert = useCallback(() => {
    if (!selected) return;
    
    const formData = new FormData();
    formData.append("intent", "convert");
    formData.append("productId", selected.id);
    formData.append("title", selected.title);
    formData.append("imageUrl", selected.imageUrl || '');
    formData.append("category_id", selectedCategory);
    formData.append("true_size", trueSize);
    formData.append("true_waist", trueWaist);
    formData.append("unit", unit);
    
    if (overrideFile) {
      formData.append("override_image", overrideFile);
    }
    
    const parsedCategory = Number.parseInt(selectedCategory, 10);
    const categoryNumeric = Number.isNaN(parsedCategory) ? null : parsedCategory;

    onConversionUpdate?.(selected.id, {
      status: "processing",
      processed: false,
      previewImageUrl: null,
      sizeScaleUrl: null,
      categoryId: categoryNumeric,
      trueSize,
      unit,
      trueWaist,
    });

    convertFetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  }, [selected, selectedCategory, trueSize, trueWaist, unit, overrideFile, onConversionUpdate, convertFetcher]);

  useEffect(() => {
    if (!selected) {
      setSelectedCategory("1");
      setTrueSize("M");
      setUnit("cm");
      setTrueWaist("50");
      setOverrideFile(null);
      return;
    }

    setOverrideFile(null);
    setSelectedCategory(status?.categoryId ? String(status.categoryId) : "1");
    setTrueSize(status?.trueSize || "M");
    setUnit(status?.unit || "cm");
    setTrueWaist(status?.trueWaist ?? "50");
  }, [selected?.id, status?.categoryId, status?.trueSize, status?.unit, status?.trueWaist]);

  const submitDisabled = !selected || isConverting;

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">{selected ? selected.title : "Select a product to convert"}</Text>

      {selected && (
        <InlineStack gap="200" blockAlign="center">
          <Text as="p" tone="subdued">Type: {selected.productType || '-'}</Text>
          <Text as="p" tone="subdued">Vendor: {selected.vendor || '-'}</Text>
          {status && (
            <Text
              as="p"
              tone={
                status.status === 'completed'
                  ? 'success'
                  : status.status === 'processing'
                  ? undefined
                  : status.status === 'failed'
                  ? 'critical'
                  : 'subdued'
              }
            >
              {status.processed ? 'Processed' : 'Not processed'} • {status.status}
            </Text>
          )}
        </InlineStack>
      )}

      <Select label="Category ID" options={categoryOptions} value={selectedCategory} onChange={handleCategoryChange} />

      <Divider />

      <Text as="h3" variant="headingSm">True Size</Text>
      <Select label="True Size" options={sizeOptions.map(s=>({label:s,value:s}))} value={trueSize} onChange={setTrueSize as any} />

      <InlineStack gap="200">
        <Select label="Unit" options={[{label:'cm',value:'cm'},{label:'inch',value:'inch'}]} value={unit} onChange={setUnit as any} />
        <TextField label="True Waist (optional)" value={trueWaist} onChange={setTrueWaist} autoComplete="off" type="number" />
      </InlineStack>
      <Divider />

      {selected && (
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">Image</Text>
          <BlockStack gap="200">
            <img src={overrideFile ? URL.createObjectURL(overrideFile) : (selected.imageUrl || "https://placehold.co/120")}
                 alt="Selected"
                 style={{ 
                   width: "100%", 
                   maxWidth: "200px", 
                   height: "auto", 
                   objectFit: 'cover', 
                   borderRadius: 8, 
                   border: '1px solid #E1E3E5',
                   display: "block",
                   margin: "0 auto"
                 }} />
            <InlineStack gap="200" wrap={false}>
              <input 
                name="override_image" 
                type="file" 
                accept="image/*" 
                onChange={(e) => setOverrideFile(e.target.files?.[0] || null)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <Button variant="plain" onClick={() => setOverrideFile(null)}>Use product image</Button>
            </InlineStack>
          </BlockStack>

          <Button 
            onClick={handleConvert} 
            variant="primary" 
            disabled={submitDisabled}
            loading={isConverting}
          >
            {isConverting ? "Converting..." : "Convert"}
          </Button>
        </BlockStack>
      )}
    </BlockStack>
  );
}
