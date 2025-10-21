import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";

// App Proxy endpoint for the storefront widget
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Needed so Shopify can probe the proxy path
  await unauthenticated.public.appProxy(request);
  return json({ ok: true });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await unauthenticated.public.appProxy(request);
  try {
    const formData = await request.formData();
    const height = formData.get("height");
    const userImage = formData.get("user_image");

    const heightNum = typeof height === "string" ? parseInt(height, 10) : undefined;
    // In dev/mock mode, don't hard-require the file; proxy uploads can be finicky.
    // We'll still return a valid mock response.

    // TODO: Wire to your orchestrator and try-on services. This is a mock.
    const tryOnImageUrl = "https://placehold.co/600x800/png?text=Try-on";
    const recommendedSize = !isNaN(heightNum as any)
      ? (heightNum as number) < 165
        ? "S"
        : (heightNum as number) < 180
        ? "M"
        : "L"
      : "M";

    return json({ tryOnImageUrl, recommendedSize });
  } catch (error: any) {
    return json({ error: error?.message || "Server error" }, { status: 500 });
  }
};


