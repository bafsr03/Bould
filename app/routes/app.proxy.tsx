import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

// Delegate to the existing implementation used by the widget-specific route.
// Shopify App Proxy is configured to hit "/app/proxy"; this file ensures that
// requests to that path are handled by the same logic as "/app/proxy/bould".
export { loader, action } from "./app.proxy.bould";


