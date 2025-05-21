import React, { useState, useCallback } from "react";
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


export default function ControlsPanel() {
  const [selectedCategory, setSelectedCategory] = useState("hat");
  const [inputHex, setInputHex] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  const categoryOptions = [
    { label: "Hat", value: "hat" },
    { label: "T-Shirt", value: "tshirt" },
    { label: "Pants", value: "pants" },
  ];

  const sizeOptions = [
    "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "onefit",
  ];

  const [checkedSizes, setCheckedSizes] = useState<Record<string, boolean>>(
    Object.fromEntries(sizeOptions.map((size) => [size, false]))
  );

  const handleCategoryChange = useCallback(
    (value: string) => setSelectedCategory(value),
    []
  );

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

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Product Details</Text>

      <Select
        label="Category"
        options={categoryOptions}
        value={selectedCategory}
        onChange={handleCategoryChange}
      />

      <Divider />

      <Text as="h3" variant="headingSm">Size Range</Text>
      <InlineStack wrap gap="200">
        {sizeOptions.map((size) => (
          <Checkbox
            key={size}
            label={size.toUpperCase()}
            checked={checkedSizes[size]}
            onChange={toggleSize(size)}
          />
        ))}
      </InlineStack>

      <Divider />

      <Text as="h3" variant="headingSm">HEX Colors</Text>
      <InlineStack gap="200" align="start" wrap={false}>
        <TextField
          label=""
          labelHidden
          value={inputHex}
          onChange={setInputHex}
          placeholder="#000000"
          autoComplete="off"
          type="text"
        />
        <Button onClick={addHexColor} variant="primary">
          Add
        </Button>
      </InlineStack>

      <InlineStack gap="200" wrap>
        {colors.map((hex) => (
          <Tag key={hex} onRemove={removeHexColor(hex)}>
            <InlineStack gap="100" align="center">
              <Box
                width="100"
                minHeight="100"
                borderRadius="200"
                background={hex as any}
              />
              <span>{hex}</span>
            </InlineStack>
          </Tag>
        ))}
      </InlineStack>

      <Divider />
    </BlockStack>
  );
}
