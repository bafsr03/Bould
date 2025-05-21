import {
  LegacyCard,
  IndexTable,
  Text,
  Thumbnail,
  Badge,
  Button,
  InlineStack,
  Box,
  Tabs,
} from "@shopify/polaris";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import React, { useState, useCallback } from "react";

const allProducts = [
  {
    id: "1",
    name: "Hoodie",
    image:
      "https://cdn.shopify.com/s/files/1/0757/9955/files/Drawer.png",
    materials: ["Teak", "Natural"],
    converted: true,
    status: "active",
  },
  {
    id: "3",
    name: "Retro Coffee Table",
    image:
      "https://cdn.shopify.com/s/files/1/0757/9955/files/Table.png",
    materials: [""],
    converted: false,
    status: "inactive", // <-- changed to inactive
  },
  {
    id: "3",
    name: "T-shirt",
    image:
      "https://cdn.shopify.com/s/files/1/0757/9955/files/Table.png",
    materials: ["Teak"],
    converted: true,
    status: "draft",
  },
    {
    id: "4",
    name: "Cap",
    image:
      "https://cdn.shopify.com/s/files/1/0757/9955/files/Table.png",
    materials: ["Teak"],
    converted: false,
    status: "draft",
  },
];

export default function LibraryTable() {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { id: "all", content: "All" },
    { id: "active", content: "Active" },
    { id: "draft", content: "Draft" },
    { id: "inactive", content: "Inactive" }, // <-- new tab
  ];

  const handleTabChange = useCallback((index: number) => {
    setSelectedTab(index);
  }, []);

  const filteredProducts = allProducts.filter((product) => {
    const tabId = tabs[selectedTab].id;
    return tabId === "all" ? true : product.status === tabId;
  });

  return (
    <LegacyCard>
      <Box padding="100">
        <Tabs
          tabs={tabs}
          selected={selectedTab}
          onSelect={handleTabChange}
        />
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
          (
            { id, name, image, materials, status, converted },
            rowIndex
          ) => (
            <IndexTable.Row
              id={id}
              key={id}
              position={rowIndex}
            >
              <IndexTable.Cell>
                <InlineStack gap="200" align="start">
                  <Thumbnail
                    source={image}
                    alt={name}
                    size="small"
                  />
                  <Text
                    variant="bodyMd"
                    fontWeight="medium"
                    as="span"
                  >
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
                <Badge
                  progress={
                    status === "active" ? "complete" : undefined
                  }
                  tone={
                    status === "draft"
                      ? "info"
                      : status === "inactive"
                      ? "critical"
                      : "success"
                  }
                >
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Badge
                  tone={converted ? "success" : "attention"}
                >
                  {converted
                    ? "Converted"
                    : "Not converted"}
                </Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <InlineStack gap="100">
                  <Button
                    icon={EditIcon}
                    variant="plain"
                  />
                  <Button
                    icon={DeleteIcon}
                    variant="plain"
                  />
                </InlineStack>
              </IndexTable.Cell>
            </IndexTable.Row>
          )
        )}
      </IndexTable>
    </LegacyCard>
  );
}
