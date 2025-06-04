import { Badge, IndexTable, LegacyCard } from "@shopify/polaris";
 import React from "react";

import type { Product } from "../../data";


interface Props {
  products: Product[];
}

const ProductIndexTable: React.FC<Props> = ({ products }) => {
  // (We’re not doing any filtering here, but you can wire up IndexFilters if needed.)

  const resourceName = { singular: "product", plural: "products" };

  // Map our “products” into IndexTable.Row elements:
  const rowMarkup = products.map((p, index) => {
    // Show a Badge based on `converted` boolean
    const statusBadge = p.converted ? (
      <Badge tone="success">Converted</Badge>
    ) : (
      <Badge tone="attention">Not Converted</Badge>
    );

    return (
      <IndexTable.Row id={p.id} key={p.id} position={index}>
        <IndexTable.Cell>{p.name}</IndexTable.Cell>
        <IndexTable.Cell>{p.category}</IndexTable.Cell>
        <IndexTable.Cell>{statusBadge}</IndexTable.Cell>
      </IndexTable.Row>
    );
  });
  return (
    <div style={{ height: "100%" }}>
      <LegacyCard>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: 400,
            width: "100%",
          }}
        >
          {/* If you want to keep IndexFilters, hook them up to sort/query here */}
          <div style={{ background: "var(--p-color-bg-surface)" }}>
            {/* <IndexFilters ... /> */}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
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