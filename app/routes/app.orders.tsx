import {
  Page,
  Layout,
  Banner,
  Badge,
  Grid,
  Text,
  Box,
  Link,
} from "@shopify/polaris";
import OrdersCard from "./ordersComponents/PaymentCard"; 
import type { Order } from "./ordersComponents/OrdersSection";
import OrderSection from "./ordersComponents/OrdersSection";
import StoreDetailsFormCard from "./ordersComponents/StoreDetailsFormCard"; 

// Sample orders for demo—swap
const sampleOrders: Order[] = [
  {
    id: "001",
    order: (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        #001
      </Text>
    ),
    date: "Jul 20 at 4:34pm",
    blanks: "Bould hoodie",
    total: "$969.44",
    paymentStatus: <Badge progress="complete">Paid</Badge>,
    fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
  },
  {
    id: "019",
    order: (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        #019
      </Text>
    ),
    date: "Jul 29 at 3:46pm",
    blanks: "Stickers",
    total: "$95.00",
    paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
    fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
  },
  {
    id: "040",
    order: (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        #040
      </Text>
    ),
    date: "sept 13 at 3:44pm",
    blanks: "Bould Blanks T-shirt",
    total: "$1,250.00",
    paymentStatus: <Badge progress="complete">Paid</Badge>,
    fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
  },
];

export default function BlanksPage() {
  return (
    <>
      {/* — Blanks header — */}
      <Page titleHidden>
        <Box paddingBlockEnd="400"> 
          <Text variant="headingXl" as="h1">
            Orders
          </Text>
        </Box>
        <Layout>
          <Layout.Section>
            <Banner title="Experimental mode" onDismiss={() => {}}>
              <p>
                Orders is still in Beta testing; you can still place orders by making stickers, or adding bould blanks with your design.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>

      <Page>
        <Layout>
          {/* Orders table section */}
          <Layout.Section>
            <OrderSection orders={sampleOrders} />
          </Layout.Section>

          {/* Section below the table for PaymentCard and StoreDetailsFormCard, side-by-side */}
          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <StoreDetailsFormCard />
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <OrdersCard />
              </Grid.Cell>
            </Grid>
          </Layout.Section>
        </Layout>
      </Page>

      {/* Footer */}
      <Box paddingBlockStart="1000" paddingBlockEnd="1000" paddingInlineStart="400" paddingInlineEnd="400">
        <div style={{ textAlign: "center" }}>
          <Text as="h4" tone="subdued">
            Need help?{" "}
            <Link url="mailto:jake@bouldhq.com" removeUnderline>
              Chat with us.
            </Link>
          </Text>
          <Box paddingBlockStart="100">
            <Text as="h4" tone="subdued">
              © 2025 Bould
            </Text>
          </Box>
        </div>
      </Box>
    </>
  );
}
