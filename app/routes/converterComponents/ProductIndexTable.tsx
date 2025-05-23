// src/components/ProductIndexTable.tsx
import React, { useState } from "react"; // Removed unused useRef, useEffect
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
    { id: "p1", product: "Blanks t-shirt", category: "T-shirt", status: <Badge tone="success">Converted</Badge> },
    { id: "p2", product: "Blanks hoodie", category: "Hoodie", status: <Badge tone="attention">Not Converted</Badge> },
    { id: "p3", product: "Blanks cap", category: "Cap", status: <Badge tone="success">Converted</Badge> },
    { id: "p4", product: "Blanks 5 panel cap", category: "Cap", status: <Badge tone="attention">Not Converted</Badge> },
    { id: "p5", product: "Blanks performance shorts", category: "Shorts", status: <Badge progress="incomplete" tone="info">In process</Badge> },
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
        {/* Flex container to manage layout: Filters at top, scrollable Table below */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: 400, // Max height for the entire filters + table section
            width: "100%", // Ensure it takes full width of LegacyCard
          }}
        >
          {/* Container for IndexFilters. This part will not scroll. */}
          <div
            style={{
              // The original sticky wrapper had a background. Retain it for visual consistency and separation.
              background: "var(--p-color-bg-surface)",
              // If IndexFilters doesn't provide its own border/shadow when not in its internal sticky state,
              // you might consider adding a borderBottom here for better visual separation from the table.
              // e.g., borderBottom: "1px solid var(--p-color-border)",
              // For now, relying on the background color should be sufficient.
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
              disableStickyMode // Correct: IndexFilters internal stickiness is disabled.
                                // It's positioned by the flex layout, not its internal sticky logic.
              mode={mode}
              setMode={setMode}
            />
          </div>

          {/* Scrollable container for IndexTable */}
          <div
            style={{
              flex: 1, // Allows this div to take up the remaining vertical space
              overflowY: "auto", // Makes this div scrollable if IndexTable content overflows
              // width: "100%", // Not strictly necessary; flex items stretch by default or take content width.
                                // Parent div width: "100%" already ensures overall width.
            }}
          >
            <IndexTable
              resourceName={resourceName}
              itemCount={orders.length}
              headings={[
                { title: "Product" },
                { title: "Category" },
                // Change alignment to 'center' for the "Status" column
                { title: "Status", alignment: "center" },
              ]}
              selectable={false} // If you don't want checkboxes on rows, set this to false. Default is true.
            >
              {rowMarkup}
            </IndexTable>
          </div>
        </div>
      </LegacyCard>
    </div>
  );
};

export default ProductIndexTable;