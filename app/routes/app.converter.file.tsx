import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  
  if (!path) {
    return new Response("Missing path parameter", { status: 400 });
  }

  try {
    console.log(`[CONVERTER FILE] Serving file: ${path}`);
    
    const baseUrl = process.env.GARMENTS_API_URL || "http://localhost:8001";
    const fileUrl = `${baseUrl}/v1/file?path=${encodeURIComponent(path)}`;
    
    console.log(`[CONVERTER FILE] Fetching from: ${fileUrl}`);
    
    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `Bearer ${await getApiToken(baseUrl)}`
      }
    });
    
    if (!response.ok) {
      console.error(`[CONVERTER FILE] Failed to fetch file: ${response.status} ${response.statusText}`);
      return new Response("File not found", { status: 404 });
    }
    
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();
    
    console.log(`[CONVERTER FILE] Successfully served file: ${path} (${buffer.byteLength} bytes)`);
    
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    console.error(`[CONVERTER FILE] Error serving file ${path}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
};

async function getApiToken(baseUrl: string): Promise<string> {
  try {
    const tokenRes = await fetch(`${baseUrl}/v1/auth/token`, { method: "POST" });
    const tokenJson = await tokenRes.json();
    return tokenJson.token as string;
  } catch (error) {
    console.error("[CONVERTER FILE] Failed to get API token:", error);
    throw error;
  }
}
