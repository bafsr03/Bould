import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { getPlanForShop } from "../billing/plan.server";
import {
  getApparelPreviewUsage,
  isApparelPreviewLimitExceeded,
} from "../billing/usage.server";

// Enhanced logging function
function logRequest(method: string, path: string, status: number, duration: number, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${path} - ${status} (${duration}ms)`, details ? JSON.stringify(details, null, 2) : '');
}

function logError(error: any, context: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR in ${context}:`, error?.message || error, details ? JSON.stringify(details, null, 2) : '');
  if (error?.stack) {
    console.error('Stack trace:', error.stack);
  }
}

const UPGRADE_WIDGET_MESSAGE = "Upgrade to continue using Bould.";

// Enforce required env in production
const RECOMMENDER_BASE = (process.env.RECOMMENDER_BASE_URL || process.env.RECOMMENDER_URL || '').trim();
const RECOMMENDER_API_KEY = (process.env.RECOMMENDER_API_KEY || process.env.API_KEY || '').trim();
if (process.env.NODE_ENV === 'production') {
  if (!RECOMMENDER_BASE || !RECOMMENDER_API_KEY) {
    throw new Error('RECOMMENDER_BASE_URL and RECOMMENDER_API_KEY must be set in production');
  }
}

// Simple in-memory rate limiter
const _buckets: Map<string, { tokens: number; last: number }> = new Map();
function rateLimit(ip: string, requestsPerMin = 60, burst = 30) {
  const now = Date.now() / 1000;
  const refillRate = requestsPerMin / 60;
  const capacity = burst;
  const entry = _buckets.get(ip) || { tokens: capacity, last: now };
  const tokens = Math.min(capacity, entry.tokens + refillRate * (now - entry.last));
  if (tokens < 1) {
    _buckets.set(ip, { tokens, last: now });
    const err: any = new Error('Too Many Requests');
    err.status = 429;
    throw err;
  }
  _buckets.set(ip, { tokens: tokens - 1, last: now });
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit & { retry?: number; retryDelayMs?: number } = {}) {
  const { retry = 2, retryDelayMs = 400, ...rest } = init;
  let attempt = 0;
  let lastError: any;
  while (attempt <= retry) {
    try {
      const res = await fetch(input, rest);
      if (!res.ok && (res.status >= 500 || res.status === 429)) {
        throw new Error(`Upstream error ${res.status}`);
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt === retry) break;
      await new Promise(r => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
      attempt++;
    }
  }
  throw lastError;
}

async function recordWidgetEvent(data: {
  productId: string;
  conversionId?: string | null;
  shopDomain?: string | null;
  recommendedSize?: string | null;
  confidence?: number | null;
  requestId?: string | null;
  correlationId?: string | null;
}) {
  try {
    await (prisma as any).widgetEvent.create({
      data: {
        shopifyProductId: data.productId,
        conversionId: data.conversionId ?? null,
        shopDomain: data.shopDomain ?? null,
        recommendedSize: data.recommendedSize ?? null,
        confidence: data.confidence ?? null,
        requestId: data.requestId ?? null,
        correlationId: data.correlationId ?? null,
      },
    });
  } catch (error: any) {
    logError(error, 'widget event create', { productId: data.productId, conversionId: data.conversionId ?? null });
  }
}

// App Proxy endpoint for the storefront widget
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  try {
    await unauthenticated.public.appProxy(request);

    const url = new URL(request.url);
    const intent = url.searchParams.get('intent');
    const productId = url.searchParams.get('product_id');
    const shopDomain = url.searchParams.get('shop') || undefined;
    const designMode = url.searchParams.get('design_mode') === '1';

    // Preflight status check for storefront widget
    if (intent === 'status') {
      if (!productId && !designMode) {
        logRequest('GET', '/apps/bould-widget', 400, Date.now() - startTime, { requestId, error: 'Missing product ID (status preflight)' });
        return json({ error: 'Product ID is required', debug: { requestId } }, { status: 400, headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
      }
      if (!shopDomain) {
        logRequest('GET', '/apps/bould-widget', 400, Date.now() - startTime, { requestId, error: 'Missing shop domain (status preflight)' });
        return json({ error: 'Shop domain is required', debug: { requestId } }, { status: 400, headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
      }

      let isGarmentProcessed = false;
      let conversionStatus: string = 'not_found';
      if (productId) {
        try {
          const conversion = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
          if (conversion) {
            conversionStatus = conversion.status;
            isGarmentProcessed = conversion.processed === true && conversion.status === 'completed';
          }
        } catch (dbError: any) {
          logError(dbError, 'widget loader status db', { requestId, productId });
          conversionStatus = 'database_error';
        }
      } else {
        conversionStatus = 'design_mode';
      }

      const planContext = await getPlanForShop({ shopDomain });
      let planBlocked = false;
      let planMessage: string | null = null;
      let apparelLimit = planContext.plan.capabilities.apparelPreviewLimit ?? null;

      if (shopDomain && apparelLimit != null) {
        try {
          const apparelUsage = await getApparelPreviewUsage(shopDomain);
          planBlocked = isApparelPreviewLimitExceeded(planContext.plan, apparelUsage);
          if (planBlocked) {
            planMessage = UPGRADE_WIDGET_MESSAGE;
          }
        } catch (usageError) {
          logError(usageError, 'widget loader usage', { requestId, shopDomain });
        }
      }

      const payload = {
        ok: true,
        productId: productId ?? null,
        isProcessed: isGarmentProcessed,
        conversionStatus,
        plan: {
          id: planContext.planId,
          name: planContext.plan.name,
          blocked: planBlocked,
          message: planMessage,
          apparelPreviewLimit: apparelLimit,
        },
        debug: { requestId }
      };

      logRequest('GET', '/apps/bould-widget', 200, Date.now() - startTime, { requestId, productId: productId ?? null, conversionStatus, isGarmentProcessed, designMode });
      return json(payload, { headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
    }

    // Poll try-on task status (for nano provider)
    if (intent === 'tryon_status') {
      const taskId = url.searchParams.get('task_id');
      if (!taskId) {
        return json({ error: 'task_id is required', debug: { requestId } }, { status: 400 });
      }
      const base = (process.env.RECOMMENDER_BASE_URL || process.env.RECOMMENDER_URL || '').replace(/\/$/, '');
      const apiKey = process.env.RECOMMENDER_API_KEY || process.env.API_KEY || '';
      if (!base || !apiKey) {
        return json({ error: 'Recommender not configured', debug: { requestId } }, { status: 500 });
      }
      try {
        const res = await fetch(`${base}/v1/try-on/status?task_id=${encodeURIComponent(taskId)}`, { headers: { 'x-api-key': apiKey, 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
        const data = await res.json();
        const payload = { ok: true, task_id: taskId, status: data.status, result_image_url: data.result_image_url || null, error: data.error || data.detail || data.message || null, debug: { requestId } };
        return json(payload, { headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
      } catch (e: any) {
        return json({ error: 'Failed to fetch task status', debug: { requestId } }, { status: 502 });
      }
    }

    const duration = Date.now() - startTime;
    logRequest('GET', '/apps/bould-widget', 200, duration, { requestId, probe: true });
    return json({ ok: true, debug: { requestId } }, { headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError(error, 'widget loader', { duration, requestId });
    return json({ error: "Failed to initialize widget", debug: { requestId } }, { status: 500, headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    await unauthenticated.public.appProxy(request);
    
    // Correlation ID from client (if provided)
    const clientCorrelationId = request.headers.get('X-Correlation-ID') || undefined;

    // Basic rate limit by IP
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown';
    try { rateLimit(ip, 60, 30); } catch (e: any) {
      logRequest('POST', '/apps/bould-widget', 429, Date.now() - startTime, { requestId, ip });
      return json({ error: 'Too Many Requests', debug: { requestId } }, { status: 429 });
    }

    const formData = await request.formData();
    const height = formData.get("height");
    const userImage = formData.get("user_image");

    // Enhanced input validation with detailed logging
    const hasUserImage = !!userImage && typeof (userImage as any) === "object" && typeof (userImage as any).arrayBuffer === "function";
    if (typeof height !== "string" || !hasUserImage) {
      logRequest('POST', '/apps/bould-widget', 400, Date.now() - startTime, { 
        requestId, 
        error: 'Invalid form data',
        hasHeight: typeof height === "string",
        hasUserImage: hasUserImage
      });
      return json({ 
        error: "Invalid form data. Please provide both height and image.",
        debug: { requestId }
      }, { status: 400 });
    }

    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 80 || heightNum > 250) {
      logRequest('POST', '/apps/bould-widget', 400, Date.now() - startTime, { 
        requestId, 
        error: 'Invalid height',
        height: heightNum
      });
      return json({ 
        error: "Height must be between 80 and 250 cm",
        debug: { requestId }
      }, { status: 400 });
    }

    // Get the current product from the request context
    const url = new URL(request.url);
    const productId = url.searchParams.get("product_id");
    const shopDomain = url.searchParams.get('shop') || undefined;
    
    if (!productId) {
      logRequest('POST', '/apps/bould-widget', 400, Date.now() - startTime, { 
        requestId, 
        error: 'Missing product ID'
      });
      return json({ 
        error: "Product ID is required",
        debug: { requestId }
      }, { status: 400 });
    }
    if (!shopDomain) {
      logRequest('POST', '/apps/bould-widget', 400, Date.now() - startTime, {
        requestId,
        error: 'Missing shop domain'
      });
      return json({
        error: "Shop domain is required",
        debug: { requestId }
      }, { status: 400 });
    }

    const planContext = await getPlanForShop({ shopDomain });
    const apparelLimit = planContext.plan.capabilities.apparelPreviewLimit ?? null;
    if (shopDomain && apparelLimit != null) {
      try {
        const apparelUsage = await getApparelPreviewUsage(shopDomain);
        const planBlocked = isApparelPreviewLimitExceeded(planContext.plan, apparelUsage);
        if (planBlocked) {
          const message = UPGRADE_WIDGET_MESSAGE;
          return json(
            {
              error: message,
              debug: {
                requestId,
                shopDomain,
                planId: planContext.planId,
                apparelPreviewLimit: apparelLimit,
                apparelPreviewsUsed: apparelUsage.total,
              },
            },
            {
              status: 409,
              headers: { 'X-Correlation-ID': clientCorrelationId || requestId },
            }
          );
        }
      } catch (usageError) {
        logError(usageError, 'widget action usage', { requestId, shopDomain });
      }
    }

    // Check if garment has been processed using real database check
    let isGarmentProcessed = false;
    let conversionStatus = 'unknown';
    
    try {
      const conversion = await (prisma as any).conversion.findFirst({ 
        where: { shopifyProductId: productId } 
      });
      
      if (conversion) {
        isGarmentProcessed = conversion.processed === true && conversion.status === 'completed';
        conversionStatus = conversion.status;
        
        logRequest('POST', '/apps/bould-widget', 200, Date.now() - startTime, { 
          requestId, 
          productId,
          conversionStatus,
          isGarmentProcessed,
          conversionId: conversion.id
        });
      } else {
        logRequest('POST', '/apps/bould-widget', 200, Date.now() - startTime, { 
          requestId, 
          productId,
          conversionStatus: 'not_found',
          isGarmentProcessed: false
        });
      }
    } catch (dbError: any) {
      logError(dbError, 'database check', { requestId, productId });
      // Fallback to mock behavior if database check fails
      isGarmentProcessed = Math.random() > 0.3;
      conversionStatus = 'database_error';
    }
    
    if (!isGarmentProcessed) {
      const errorMessage = conversionStatus === 'not_found' 
        ? "This garment hasn't been edited."
        : conversionStatus === 'processing'
        ? "This garment is currently being processed. Please wait a few minutes and try again."
        : conversionStatus === 'failed'
        ? "Garment conversion failed. Please try converting again in the Bould app."
        : "This garment hasn't been edited.";
        
      logRequest('POST', '/apps/bould-widget', 409, Date.now() - startTime, { 
        requestId, 
        productId,
        conversionStatus,
        error: 'garment_not_processed'
      });
      
      return json({ 
        error: errorMessage,
        debug: { 
          requestId, 
          productId, 
          conversionStatus,
          suggestion: "Visit the Bould app to convert this garment first",
          correlationId: clientCorrelationId
        }
      }, { status: 409, headers: { 'X-Correlation-ID': clientCorrelationId || requestId } });
    }

    // Real orchestration via recommender
    const base = (RECOMMENDER_BASE || '').replace(/\/$/, '');
    const apiKey = RECOMMENDER_API_KEY;
    if (!base || !apiKey) {
      throw new Error('Recommender not configured');
    }

    // Prepare user image buffer
    const userBuffer = Buffer.from(await (userImage as any).arrayBuffer());
    const userFileName = (userImage as any).name || 'user.jpg';
    const userMime = (userImage as any).type || 'image/jpeg';

    // Fetch garment data from DB (image URL, metadata)
    let conversionRecord: any = null;
    try {
      conversionRecord = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
    } catch {}
    if (!conversionRecord || !conversionRecord.imageUrl) {
      return json({ error: 'Garment image URL missing for this product', debug: { requestId, productId } }, { status: 502 });
    }

    // Download garment image
    const garmentRes = await fetch(conversionRecord.imageUrl);
    if (!garmentRes.ok) {
      return json({ error: 'Failed to download garment image', debug: { requestId, productId, status: garmentRes.status } }, { status: 502 });
    }
    const garmentBuffer = Buffer.from(await garmentRes.arrayBuffer());
    const garmentFileName = (conversionRecord.imageUrl as string).split('/').pop() || 'garment.jpg';
    const garmentMime = garmentRes.headers.get('content-type') || 'image/jpeg';

    // Call recommend endpoint
    const recFd = new FormData();
    recFd.append('height', String(heightNum));
    recFd.append('user_image', new Blob([userBuffer], { type: userMime }) as any, userFileName);
    recFd.append('garment_image', new Blob([garmentBuffer], { type: garmentMime }) as any, garmentFileName);
    recFd.append('category_id', String(conversionRecord.categoryId));
    recFd.append('true_size', String(conversionRecord.trueSize));
    recFd.append('unit', String(conversionRecord.unit || 'cm'));

    const recRes = await fetchWithRetry(`${base}/v1/recommend`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'X-Correlation-ID': clientCorrelationId || requestId },
      body: recFd as any,
      retry: 2,
      retryDelayMs: 400
    });
    if (!recRes.ok) {
      const text = await recRes.text().catch(() => '');
      return json({ error: 'Recommendation service error', debug: { requestId, status: recRes.status, body: text } }, { status: 502 });
    }
    const recData: any = await recRes.json();

    // Call try-on endpoint (may be async when using nano provider)
    const tryFd = new FormData();
    tryFd.append('user_image', new Blob([userBuffer], { type: userMime }) as any, userFileName);
    tryFd.append('garment_image', new Blob([garmentBuffer], { type: garmentMime }) as any, garmentFileName);

    const publicBase = process.env.PUBLIC_BASE_URL || undefined;
    const callbackUrl = publicBase ? `${publicBase.replace(/\/$/, '')}/v1/try-on/nano/callback` : undefined;
    if (callbackUrl) {
      tryFd.append('callback_url', callbackUrl as any);
    }

    const tryRes = await fetchWithRetry(`${base}/v1/try-on`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'X-Correlation-ID': clientCorrelationId || requestId },
      body: tryFd as any,
      retry: 2,
      retryDelayMs: 400
    });
    if (!tryRes.ok && tryRes.status !== 202) {
      const text = await tryRes.text().catch(() => '');
      return json({ error: 'Try-on service error', debug: { requestId, status: tryRes.status, body: text } }, { status: 502 });
    }
    const tryData: any = await tryRes.json().catch(() => ({}));
    let response: any;
    if (tryRes.status === 202 || tryData?.status === 'queued' || tryData?.provider === 'nano' && (tryData?.task_id || tryData?.task)) {
      const taskId = tryData?.task_id || tryData?.task?.id || tryData?.task?.taskId;
      response = {
        queued: true,
        task_id: taskId,
        provider: 'nano',
        recommended_size: recData.recommended_size || recData.recommendedSize,
        confidence: recData.confidence,
        tailor_feedback: recData.tailor_feedback || recData.tailorFeedback,
        debug: { requestId, productId, conversionStatus, correlationId: clientCorrelationId }
      };
    } else {
      const resultImage = tryData.result_image_url || tryData.url || tryData.tryOnImageUrl || '';
      const tryOnImageUrl = resultImage.startsWith('http') ? resultImage : `${base}${resultImage}`;
      response = {
        tryOnImageUrl,
        recommended_size: recData.recommended_size || recData.recommendedSize,
        confidence: recData.confidence,
        tailor_feedback: recData.tailor_feedback || recData.tailorFeedback,
        debug: { measurement_vis_url: recData?.debug?.measurement_vis_url || '', requestId, productId, conversionStatus, correlationId: clientCorrelationId }
      };
    }

    const recommendedSizeOut = typeof response.recommended_size === 'string'
      ? response.recommended_size
      : typeof response.recommended_size === 'number'
      ? String(response.recommended_size)
      : null;
    const confidenceOut = typeof response.confidence === 'number'
      ? response.confidence
      : typeof response.confidence === 'string'
      ? Number.parseFloat(response.confidence)
      : null;

    await recordWidgetEvent({
      productId,
      conversionId: conversionRecord?.id,
      shopDomain,
      recommendedSize: recommendedSizeOut,
      confidence: Number.isFinite(confidenceOut ?? NaN) ? confidenceOut : null,
      requestId,
      correlationId: clientCorrelationId,
    });

    logRequest('POST', '/apps/bould-widget', 200, Date.now() - startTime, { 
      requestId, 
      productId,
      recommendedSize: response.recommended_size,
      confidence: response.confidence,
      queued: response.queued === true
    });

    return json(response, { headers: { 'X-Correlation-ID': clientCorrelationId || requestId } });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError(error, 'widget action', { requestId, duration });
    
    return json({ 
      error: "Internal server error. Please try again later.",
      debug: { 
        requestId,
        timestamp: new Date().toISOString()
      }
    }, { status: 500, headers: { 'X-Correlation-ID': request.headers.get('X-Correlation-ID') || requestId } });
  }
};


