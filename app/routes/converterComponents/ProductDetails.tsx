import { useState, useCallback, useEffect } from "react";
import {
  Tag,
  BlockStack,
  InlineStack,
  Divider,
  Button,
  Select,
  Checkbox,
  Text,
  TextField,
  Box,
} from "@shopify/polaris";
import { useSubmit, useActionData } from "@remix-run/react";


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
  status?: { state: string; processed: boolean } | null;
  onConversionUpdate?: (productId: string, conversionData: any) => void;
}

export default function ControlsPanel({ selected, status, onConversionUpdate }: Props) {
  const submit = useSubmit();
  const actionData = useActionData<any>();
  const [selectedCategory, setSelectedCategory] = useState("1");
  const [trueSize, setTrueSize] = useState("M");
  const [unit, setUnit] = useState("cm");
  const [trueWaist, setTrueWaist] = useState("50");
  const [inputHex, setInputHex] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [overrideFile, setOverrideFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Handle conversion response
  useEffect(() => {
    if (actionData?.success && actionData?.conversion && selected && onConversionUpdate) {
      onConversionUpdate(selected.id, actionData.conversion);
      setIsConverting(false);
    }
  }, [actionData, selected, onConversionUpdate]);

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

  const [checkedSizes, setCheckedSizes] = useState<Record<string, boolean>>(
    Object.fromEntries(sizeOptions.map((size) => [size, false]))
  );

  const handleCategoryChange = useCallback((value: string) => setSelectedCategory(value), []);

  const toggleSize = (size: string) => (checked: boolean) => {
    setCheckedSizes((prev) => ({ ...prev, [size]: checked }));
  };

  const addHexColor = () => {
    const validHex = /^#[0-9A-Fa-f]{6}$/;
    if (validHex.test(inputHex) && !colors.includes(inputHex)) {
      setColors((prev) => [...prev, inputHex]);
      setInputHex("");
    }
  };

  const removeHexColor = useCallback(
    (hex: string) => () =>
      setColors((prev) => prev.filter((c) => c !== hex)),
    []
  );

  const handleConvert = useCallback(() => {
    if (!selected) return;
    
    setIsConverting(true);
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
    
    submit(formData, { 
      method: "post", 
      encType: "multipart/form-data",
      replace: false
    });
  }, [selected, selectedCategory, trueSize, trueWaist, unit, overrideFile, submit]);

  const submitDisabled = !selected || isConverting;

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">{selected ? selected.title : "Select a product to convert"}</Text>

      {selected && (
        <InlineStack gap="200" blockAlign="center">
          <Text as="p" tone="subdued">Type: {selected.productType || '-'}</Text>
          <Text as="p" tone="subdued">Vendor: {selected.vendor || '-'}</Text>
          {status && (
            <Text as="p" tone={status.state === 'completed' ? 'success' : status.state === 'processing' ? undefined : status.state === 'failed' ? 'critical' : 'subdued'}>
              {status.processed ? 'Processed' : 'Not processed'} • {status.state}
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
