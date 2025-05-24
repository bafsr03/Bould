import { useState } from "react";
import {
  IndexTable,
  IndexFilters,
  LegacyCard,
  useSetIndexFiltersMode,
  Badge,
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
      <IndexTable.Cell>{status}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <div style={{ height: "100%" }}>
      <LegacyCard>
        {/* Flex container to manage layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: 400, 
            width: "100%",
          }}
        >
          {/* Container for IndexFilters. */}
          <div
            style={{
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

          {/* Scrollable container for IndexTable */}
          <div
            style={{
              flex: 1,
              overflowY: "auto", 
            }}
          >
            <IndexTable
              resourceName={resourceName}
              itemCount={orders.length}
              headings={[
                { title: "Product" },
                { title: "Category" },
               
                { title: "Status", alignment: "center" },
              ]}
              selectable={false}
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