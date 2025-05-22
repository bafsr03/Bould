import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useNavigation, useLocation } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import LoadingPage from "./loadingpage"; // Import the new LoadingPage component

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

// Helper function to determine loading titles based on the target path
function getLoadingTitle(pathname: string): string {
  if (pathname.startsWith("/app/stickers")) return "Loading Stickers...";
  if (pathname.startsWith("/app/blanks")) return "Loading Blanks...";
  if (pathname.startsWith("/app/converter")) return "Loading Converter...";
  if (pathname.startsWith("/app/orders")) return "Loading Orders...";
  if (pathname.startsWith("/app/pricing")) return "Loading Pricing...";
  if (pathname.startsWith("/app")) return "Loading Bould..."; // For home or other general app pages
  return "Loading..."; // Default
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const location = useLocation(); // Current location for initial load context

  // navigation.state is 'loading' when navigating to a new page and its loader is running.
  // navigation.state can also be 'submitting' for form submissions.
  const isLoading = navigation.state === "loading" || navigation.state === "submitting";

  // Use navigation.location.pathname for the target path during navigation,
  // otherwise use the current location.pathname (e.g., for initial load context, though this primarily targets transitions).
  const targetPathname = navigation.location?.pathname || location.pathname;
  const loadingPageTitle = getLoadingTitle(targetPathname);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/converter">Converter</Link>
        <Link to="/app/blanks">Blanks</Link>
        <Link to="/app/stickers">Stickers</Link>
        <Link to="/app/orders">Orders</Link>
        <Link to="/app/pricing">Pricing</Link>
      </NavMenu>
      {isLoading ? (
        <LoadingPage pageTitleInBar={loadingPageTitle} />
      ) : (
        <Outlet />
      )}
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};