// app/ordersComponents/OrdersSection.tsx
import React from 'react';
import { IndexTable, Badge, Text, LegacyCard } from "@shopify/polaris";

// Define the data structure for an order with JSON-serializable fields
export type Order = {
  id: string;
  orderNumber: string; // e.g., "#001" - was previously a ReactNode
  date: string;
  blanks: string;
  total: string;
  // Use specific string literal types for status to ensure valid 'progress' prop for Badge
  paymentStatusProgress: "complete" | "partiallyComplete" | "incomplete" | "pending";
  paymentStatusText: string; // e.g., "Paid", "Partially paid"
  fulfillmentStatusProgress: "complete" | "incomplete" | "pending";
  fulfillmentStatusText: string; // e.g., "Unfulfilled"
};

type OrderSectionProps = {
  orders: Order[]; // Receives the updated Order type
};

export default function OrderSection({ orders }: OrderSectionProps) {
  const resourceName = {
    singular: "order",
    plural: "orders",
  };

  const rowMarkup = orders.map(
    (
      {
        id,
        orderNumber,
        date,
        blanks,
        total,
        paymentStatusProgress,
        paymentStatusText,
        fulfillmentStatusProgress,
        fulfillmentStatusText,
      },
      index
    ) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {orderNumber} {/* Render the Text component here */}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{date}</IndexTable.Cell>
        <IndexTable.Cell>{blanks}</IndexTable.Cell>
        <IndexTable.Cell>{total}</IndexTable.Cell>
        <IndexTable.Cell>
          {/* Render the Badge component here */}
          <Badge progress={paymentStatusProgress} 
                 tone={ // Optional: add tone for better visual cues
                    paymentStatusProgress === 'complete' ? 'success' :
                    paymentStatusProgress === 'partiallyComplete' ? 'attention' :
                    paymentStatusProgress === 'incomplete' ? 'critical' : 
                    paymentStatusProgress === 'pending' ? 'info' : undefined
                  }>
            {paymentStatusText}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {/* Render the Badge component here */}
          <Badge progress={fulfillmentStatusProgress}
                 tone={ // Optional: add tone
                    fulfillmentStatusProgress === 'complete' ? 'success' :
                    fulfillmentStatusProgress === 'incomplete' ? 'warning' :
                    fulfillmentStatusProgress === 'pending' ? 'info' : undefined
                  }>
            {fulfillmentStatusText}
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <LegacyCard> {/* Using LegacyCard as per original structure context */}
      <IndexTable
        resourceName={resourceName}
        itemCount={orders.length}
        headings={[
          { title: "Order" },
          { title: "Date" },
          { title: "Blanks" },
          { title: "Total" },
          { title: "Payment status" },
          { title: "Fulfillment status" },
        ]}
        selectable={false} // Assuming not selectable
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}