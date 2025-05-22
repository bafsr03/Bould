// src/components/ProductIndexTable.tsx
import React, { useState } from "react";
import {
  IndexTable,
  IndexFilters,
  LegacyCard,
  useSetIndexFiltersMode,
  Badge,
  // Box, // Keep Box imported if you foresee needing it for fine-tuning
} from "@shopify/polaris";

const ProductIndexTable = () => {
  const [sortSelected, setSortSelected] = useState<string[]>(["product asc"]);
  const { mode, setMode } = useSetIndexFiltersMode();
  const [queryValue, setQueryValue] = useState("");

  const orders = [
    { id: "p1", product: "T-Shirt", category: "Clothing", status: <Badge tone="success">Converted</Badge> },
    { id: "p2", product: "Sticker", category: "Merch", status: <Badge tone="attention">Not Converted</Badge> },
    { id: "p3", product: "Hoodie", category: "Clothing", status: <Badge tone="success">Converted</Badge> },
    { id: "p4", product: "Cap", category: "Clothing", status: <Badge tone="attention">Not Converted</Badge> },
    { id: "p5", product: "Shorts", category: "Clothing", status: <Badge progress="incomplete" tone="info">In process</Badge> },
  ];

  const resourceName = { singular: "product", plural: "products" };

  const rowMarkup = orders.map(({ id, product, category, status }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      position={index}
    >
      <IndexTable.Cell>{product}</IndexTable.Cell>
      <IndexTable.Cell>{category}</IndexTable.Cell>
      {/* The Badge component will now be centered within this cell due to heading alignment */}
      <IndexTable.Cell>{status}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <div style={{ height: "100%" }}>
      <LegacyCard>
        <div
          style={{
            maxHeight: 400,
            overflowY: "auto",
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "var(--p-color-bg-surface)",
            }}
          >
            <IndexFilters
              sortOptions={[
                { label: "Product", value: "product asc", directionLabel: "A-Z" },
                { label: "Product", value: "product desc", directionLabel: "Z-A" },
                { label: "Category", value: "category asc", directionLabel: "A-Z" },
                { label: "Category", value: "category desc", directionLabel: "Z-A" },
              ]}
              sortSelected={sortSelected}
              queryValue={queryValue}
              queryPlaceholder="Search by product or category"
              onQueryChange={setQueryValue}
              onQueryClear={() => setQueryValue("")}
              onSort={setSortSelected}
              primaryAction={{ type: "save-as", onAction: async () => true, disabled: true }}
              cancelAction={{ onAction: () => {}, disabled: true }}
              tabs={[{ content: "All", id: "all-0", isLocked: true }]}
              selected={0}
              onSelect={() => {}}
              canCreateNewView={false}
              onCreateNewView={() => Promise.resolve(true)}
              filters={[]}
              appliedFilters={[]}
              onClearAll={() => {}}
              disableStickyMode
              mode={mode}
              setMode={setMode}
            />
          </div>
          <IndexTable
            resourceName={resourceName}
            itemCount={orders.length}
            headings={[
              { title: "Product" },
              { title: "Category" },
              // Change alignment to 'center' for the "Status" column
              { title: "Status", alignment: "center" },
            ]}
            // selectable={false} // This prop is not standard and should be removed
          >
            {rowMarkup}
          </IndexTable>
        </div>
      </LegacyCard>
    </div>
  );
};

export default ProductIndexTable;