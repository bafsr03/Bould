// app/routes/app.orders.tsx (or your equivalent route file)

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react"; // Import Form here
import {
  Page,
  Layout,
  Banner,
  Grid,
  Text,
  Box,
  Link,
} from "@shopify/polaris";

// Data fetching and updating functions
import { getStoreDetails, updateStoreDetails, StoreDetails } from "../data";

// UI Components
import OrdersCard from "./ordersComponents/PaymentCard";
import type { Order } from "./ordersComponents/OrdersSection";
import OrderSection from "./ordersComponents/OrdersSection";
import StoreDetailsFormCard from "./ordersComponents/StoreDetailsFormCard";

// Sample orders (assuming it's defined as before)
const sampleOrders: Order[] = [
  {
    id: "001",
    orderNumber: "#001",
    date: "Jul 20 at 4:34pm",
    blanks: "Bould hoodie",
    total: "$969.44",
    paymentStatusProgress: "complete",
    paymentStatusText: "Paid",
    fulfillmentStatusProgress: "incomplete",
    fulfillmentStatusText: "Unfulfilled",
  },
  {
    id: "019",
    orderNumber: "#019",
    date: "Jul 29 at 3:46pm",
    blanks: "Stickers",
    total: "$95.00",
    paymentStatusProgress: "partiallyComplete",
    paymentStatusText: "Partially paid",
    fulfillmentStatusProgress: "incomplete",
    fulfillmentStatusText: "Unfulfilled",
  },
  {
    id: "040",
    orderNumber: "#040",
    date: "sept 13 at 3:44pm",
    blanks: "Bould Blanks T-shirt",
    total: "$1,250.00",
    paymentStatusProgress: "complete",
    paymentStatusText: "Paid",
    fulfillmentStatusProgress: "incomplete",
    fulfillmentStatusText: "Unfulfilled",
  },
];


type LoaderData = {
  storeDetails: StoreDetails;
  orders: Order[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const storeDetailsData = await getStoreDetails();
  const safeStoreDetails: StoreDetails = {
    storeName: storeDetailsData?.storeName ?? "",
    accountEmail: storeDetailsData?.accountEmail ?? "",
  };
  return json<LoaderData>({ storeDetails: safeStoreDetails, orders: sampleOrders });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateStoreDetails") {
    const storeName = formData.get("storeName");
    const accountEmail = formData.get("accountEmail");

    const errors: { storeName?: string; accountEmail?: string } = {};

    if (typeof storeName !== "string" || !storeName.trim()) {
      errors.storeName = "Store name is required.";
    }
    if (typeof accountEmail !== "string" || !accountEmail.trim()) {
      errors.accountEmail = "Account email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
      errors.accountEmail = "Please enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      return json({ intent: "updateStoreDetails", errors, submittedValues: { storeName, accountEmail } }, { status: 400 });
    }

    await updateStoreDetails({ storeName: storeName as string, accountEmail: accountEmail as string });
    return redirect(request.url);
  }

  return json({ intent: "unknown", error: "Unknown action" }, { status: 400 });
};

export default function BlanksPage() {
  const { storeDetails, orders } = useLoaderData<LoaderData>();

  return (
    <>
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
                Orders is still in Beta testing; you can still place orders by
                making stickers, or adding bould blanks with your design.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>

      <Page>
        <Layout>
          <Layout.Section>
            <OrderSection orders={orders} />
          </Layout.Section>

          <Layout.Section>
            {/* Form now wraps the Grid containing both cards */}
            <Form method="post">
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                  <StoreDetailsFormCard
                    initialStoreName={storeDetails.storeName}
                    initialAccountEmail={storeDetails.accountEmail}
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                  {/* PaymentCard will now contain the submit button for the form */}
                  <OrdersCard />
                </Grid.Cell>
              </Grid>
            </Form>
          </Layout.Section>
        </Layout>
      </Page>

      <Box
        paddingBlockStart="1000"
        paddingBlockEnd="1000"
        paddingInlineStart="400"
        paddingInlineEnd="400"
      >
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