 import React, { useState, useCallback } from "react";
import {
  Badge,
  Box,
  InlineStack,
  IndexTable,
  LegacyCard,
  Text,
  Thumbnail,
  Button,
} from "@shopify/polaris";
import { Form } from "@remix-run/react";

type ConversionStatus = "pending" | "processing" | "completed" | "failed";

type ShopifyProduct = {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  imageUrl: string | null;
};

interface Props {
  products: ShopifyProduct[];
  states: Record<string, {
    status: ConversionStatus;
    processed: boolean;
    previewImageUrl?: string | null;
    sizeScaleUrl?: string | null;
    categoryId?: number | null;
    trueSize?: string | null;
    unit?: string | null;
    trueWaist?: string | null;
  }>;
  onSelect?: (product: ShopifyProduct) => void;
  selectedProductId?: string;
}

export default function LibraryTable({ products, states, onSelect, selectedProductId }: Props) {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = [
    { id: "all", content: "All" },
    { id: "active", content: "Active" },
    { id: "draft", content: "Draft" },
    { id: "inactive", content: "Inactive" },
  ];

  const handleTabChange = useCallback((index: number) => {
    setSelectedTab(index);
  }, []);

  // Filter based on the current tab’s id
  const filteredProducts = products.filter((product) => {
    const tabId = tabs[selectedTab].id;
    return tabId === "all" ? true : product.status?.toLowerCase() === tabId;
  });

  return (
    <LegacyCard>
      <Box padding="100">
        <InlineStack gap="100">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(idx)}
              style={{
                background: idx === selectedTab ? "#eaeaea" : "transparent",
                padding: "8px 16px",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.content}
            </button>
          ))}
        </InlineStack>
      </Box>

      <IndexTable
        resourceName={{ singular: "product", plural: "products" }}
        itemCount={filteredProducts.length}
        selectable={false}
        headings={[
          { title: "Product" },
          { title: "Category" },
          { title: "Processed" },
          { title: "Status" },
          { title: "Actions" },
        ]}
      >
        {filteredProducts.map((p, rowIndex) => {
          const st = states[p.id] || { status: "pending", processed: false };
          const statusTone =
            st.status === "completed"
              ? "success"
              : st.status === "processing"
              ? "info"
              : st.status === "failed"
              ? "critical"
              : "attention";

          return (
            <IndexTable.Row id={p.id} key={p.id} position={rowIndex}>
              <IndexTable.Cell>
                <InlineStack gap="200" align="start">
                  <Thumbnail source={p.imageUrl || "https://placehold.co/64"} alt={p.title} size="small" />
                  <Text variant="bodyMd" fontWeight="medium" as="span">
                    {p.title} {selectedProductId === p.id ? "(Selected)" : ""}
                  </Text>
                </InlineStack>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text as="span">{p.productType || "-"}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Badge tone={st.processed ? "success" : "attention"}>
                  {st.processed ? "Yes" : "No"}
                </Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Badge tone={statusTone}>
                  {st.status.charAt(0).toUpperCase() + st.status.slice(1)}
                </Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Button onClick={() => { onSelect && onSelect(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} variant="primary">
                  Select
                </Button>
              </IndexTable.Cell>
            </IndexTable.Row>
          );
        })}
      </IndexTable>
    </LegacyCard>
  );
}
