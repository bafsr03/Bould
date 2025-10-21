import type { LoaderFunctionArgs } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) {
    return new Response("Missing path", { status: 400 });
  }
  const res = await fetch(path);
  if (!res.ok) {
    return new Response("Upstream fetch failed", { status: 502 });
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const body = createReadableStreamFromReadable(res.body as any);
  return new Response(body, { headers: { "content-type": contentType } });
};


