// src/components/ProductIndexTable.tsx
import React, { useState } from "react";
import {
  IndexTable,
  IndexFilters,
  LegacyCard,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Badge,

} from "@shopify/polaris";

const ProductIndexTable = () => {
  const [sortSelected, setSortSelected] = useState(["product asc"]);
  const { mode, setMode } = useSetIndexFiltersMode();
  const [queryValue, setQueryValue] = useState("");

  const orders = [
    { id: "p1", product: "T-Shirt", type: "Clothing", status: <Badge tone="success">Converted</Badge> },
    { id: "p2", product: "Sticker", type: "Merch", status: <Badge tone="warning">Not Converted</Badge> },
    { id: "p3", product: "Hoodie", type: "Clothing", status: <Badge tone="success">Converted</Badge> },
    { id: "p4", product: "Cap", type: "Clothing", status: <Badge tone="warning">Not Converted</Badge> },
    { id: "p5", product: "Shorts", type: "Clothing", status: <Badge progress="incomplete" tone="info">In process</Badge> },
  ];

  const resourceName = { singular: "conversion", plural: "conversions" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(orders);

  const rowMarkup = orders.map(({ id, product, type, status }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      selected={selectedResources.includes(id)}
      position={index}
    >
      <IndexTable.Cell>{product}</IndexTable.Cell>
      <IndexTable.Cell>{type}</IndexTable.Cell>
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
              background: "white",
            }}
          >
            <IndexFilters
              sortOptions={[
                { label: "Product", value: "product asc", directionLabel: "A-Z" },
                { label: "Product", value: "product desc", directionLabel: "Z-A" },
                { label: "Type", value: "type asc", directionLabel: "A-Z" },
                { label: "Type", value: "type desc", directionLabel: "Z-A" },
              ]}
              sortSelected={sortSelected}
              queryValue={queryValue}
              queryPlaceholder="Search by product or type"
              onQueryChange={setQueryValue}
              onQueryClear={() => setQueryValue("")}
              onSort={setSortSelected}
              primaryAction={{ type: "save-as", onAction: async () => true }}
              cancelAction={{ onAction: () => {} }}
              tabs={[{ content: "All", id: "all-0", isLocked: true }]}
              selected={0}
              onSelect={() => {}}
              canCreateNewView={false}
              onCreateNewView={() => Promise.resolve(true)}
              filters={[]}
              appliedFilters={[]}
              onClearAll={() => {}}
              mode={mode}
              setMode={setMode}
            />
          </div>
          <IndexTable
            resourceName={resourceName}
            itemCount={orders.length}
            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
            condensed
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Product" },
              { title: "Type" },
              { title: "Converted", alignment: "end" },
            ]}
          >
            {rowMarkup}
          </IndexTable>
        </div>
      </LegacyCard>
    </div>
  );
};

export default ProductIndexTable;
