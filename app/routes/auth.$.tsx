import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { redirect, session } = await authenticate.admin(request);
  const { shop } = session;
  const shopName = shop.replace(".myshopify.com", "");
  return redirect(`https://admin.shopify.com/store/${shopName}/apps/bould/app`);
};
