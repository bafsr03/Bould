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
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import type { Product } from "../../data";


interface Props {
  products: Product[];
}

export default function LibraryTable({ products }: Props) {
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
    return tabId === "all" ? true : product.status === tabId;
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
          { title: "Fabric" },
          { title: "Status" },
          { title: "Converted" },
          { title: "" },
        ]}
      >
        {filteredProducts.map(
          ({ id, name, image, materials, status, converted }, rowIndex) => {
            const statusTone =
              status === "active"
                ? "success"
                : status === "draft"
                ? "info"
                : "critical";
            return (
              <IndexTable.Row id={id} key={id} position={rowIndex}>
                <IndexTable.Cell>
                  <InlineStack gap="200" align="start">
                    <Thumbnail source={image} alt={name} size="small" />
                    <Text variant="bodyMd" fontWeight="medium" as="span">
                      {name}
                    </Text>
                  </InlineStack>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <InlineStack gap="100">
                    {materials.map((mat, i) => (
                      <Badge key={i}>{mat}</Badge>
                    ))}
                  </InlineStack>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Badge tone={statusTone}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Badge tone={converted ? "success" : "attention"}>
                    {converted ? "Converted" : "Not converted"}
                  </Badge>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <InlineStack gap="100">
                    <Button icon={EditIcon} variant="plain" />
                    <Button icon={DeleteIcon} variant="plain" />
                  </InlineStack>
                </IndexTable.Cell>
              </IndexTable.Row>
            );
          }
        )}
      </IndexTable>
    </LegacyCard>
  );
}
