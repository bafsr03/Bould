import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { getPlanForShop } from "../billing/plan.server";
import {
  getApparelPreviewUsage,
  isApparelPreviewLimitExceeded,
} from "../billing/usage.server";

function logRequest(method: string, path: string, status: number, duration: number, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${path} - ${status} (${duration}ms)`, details ? JSON.stringify(details, null, 2) : "");
}

function logError(error: any, context: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR in ${context}:`, error?.message || error, details ? JSON.stringify(details, null, 2) : "");
  if (error?.stack) {
    console.error("Stack trace:", error.stack);
  }
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
    logError(error, "widget proxy event create", { productId: data.productId, conversionId: data.conversionId ?? null });
  }
}

const UPGRADE_WIDGET_MESSAGE = "Upgrade to continue using Bould.";

// Handles Shopify App Proxy requests hitting /app/proxy/bould on our app
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  try {
    try {
      // @ts-ignore - type surface differs across CLI versions
      await (unauthenticated as any).public.appProxy(request);
    } catch (e: any) {
      // In development, allow requests to proceed even if proxy verification fails
      if (process.env.NODE_ENV === 'production') {
        throw e;
      }
    }

    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");
    const productId = url.searchParams.get("product_id");
    const shopDomain = url.searchParams.get("shop") || undefined;

    if (intent === "status") {
      if (!productId) {
        logRequest("GET", "/app/proxy/bould", 400, Date.now() - startTime, { requestId, error: "Missing product ID (status preflight)" });
        return json(
          { error: "Product ID is required", debug: { requestId } },
          { status: 400, headers: { "X-Correlation-ID": request.headers.get("X-Correlation-ID") || requestId } }
        );
      }

      let isGarmentProcessed = false;
      let conversionStatus: string = "not_found";
      try {
        const conversion = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
        if (conversion) {
          conversionStatus = conversion.status;
          isGarmentProcessed = conversion.processed === true && conversion.status === "completed";
        }
      } catch (dbError: any) {
        logError(dbError, "widget loader status db", { requestId, productId });
        conversionStatus = "database_error";
      }

      let planPayload: {
        id: string | null;
        name: string | null;
        blocked: boolean;
        message: string | null;
        apparelPreviewLimit: number | null;
      } | null = null;

      try {
        const planContext = await getPlanForShop({ shopDomain });
        const apparelLimit = planContext.plan.capabilities.apparelPreviewLimit ?? null;
        let planBlocked = false;
        let planMessage: string | null = null;

        if (shopDomain && apparelLimit != null) {
          try {
            const apparelUsage = await getApparelPreviewUsage(shopDomain);
            planBlocked = isApparelPreviewLimitExceeded(planContext.plan, apparelUsage);
            if (planBlocked) {
              planMessage = UPGRADE_WIDGET_MESSAGE;
            }
          } catch (usageError) {
            logError(usageError, "widget proxy status usage", { requestId, shopDomain });
          }
        }

        planPayload = {
          id: planContext.planId,
          name: planContext.plan.name,
          blocked: planBlocked,
          message: planMessage,
          apparelPreviewLimit: apparelLimit,
        };
      } catch (planError) {
        logError(planError, "widget proxy status plan", { requestId, shopDomain });
      }

      const payload = {
        ok: true,
        productId,
        isProcessed: isGarmentProcessed,
        conversionStatus,
        plan: planPayload,
        debug: { requestId },
      };

      logRequest("GET", "/app/proxy/bould", 200, Date.now() - startTime, { requestId, productId, conversionStatus, isGarmentProcessed });
      return json(payload, { headers: { "X-Correlation-ID": request.headers.get("X-Correlation-ID") || requestId } });
    }

    // Poll try-on task status (for nano provider via app proxy)
    if (intent === "tryon_status") {
      const taskId = url.searchParams.get("task_id");
      if (!taskId) {
        return json({ error: "task_id is required" }, { status: 400 });
      }
      const base = (process.env.RECOMMENDER_BASE_URL || process.env.RECOMMENDER_URL || "").replace(/\/$/, "");
      const apiKey = process.env.RECOMMENDER_API_KEY || process.env.API_KEY || "";
      if (!base || !apiKey) {
        return json({ error: "Recommender not configured" }, { status: 500 });
      }
      try {
        const res = await fetch(`${base}/v1/try-on/status?task_id=${encodeURIComponent(taskId)}`, {
          headers: { "x-api-key": apiKey },
        });
        const data = await res.json();
        if (!res.ok) {
          return json(
            {
              error: "Try-on status error",
              debug: { requestId, taskId, status: res.status, body: data },
            },
            { status: 502 },
          );
        }
        const payload = {
          ok: true,
          task_id: taskId,
          status: data.status,
          result_image_url: data.result_image_url || null,
          error: data.error || data.detail || data.message || null,
        };
        return json(payload);
      } catch (e: any) {
        return json({ error: "Failed to fetch task status", debug: { requestId, taskId } }, { status: 502 });
      }
    }

    const duration = Date.now() - startTime;
    logRequest("GET", "/app/proxy/bould", 200, duration, { requestId, probe: true });
    return json({ ok: true, debug: { requestId } }, { headers: { "X-Correlation-ID": request.headers.get("X-Correlation-ID") || requestId } });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError(error, "widget proxy loader", { duration, requestId });
    return json(
      { error: "Failed to initialize widget", debug: { requestId } },
      { status: 500, headers: { "X-Correlation-ID": request.headers.get("X-Correlation-ID") || requestId } }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    try {
      // @ts-ignore - type surface differs across CLI versions
      await (unauthenticated as any).public.appProxy(request);
    } catch (e: any) {
      if (process.env.NODE_ENV === 'production') {
        throw e;
      }
    }

    const clientCorrelationId = request.headers.get("X-Correlation-ID") || undefined;

    const formData = await request.formData();
    const height = formData.get("height");
    const userImage = formData.get("user_image");
    const productImageUrlField = formData.get("product_image_url");
    const rawProductImageUrl = typeof productImageUrlField === "string" ? productImageUrlField.trim() : "";
    const productImageUrl = rawProductImageUrl.startsWith("//") ? `https:${rawProductImageUrl}` : rawProductImageUrl;

    const hasUserImage = !!userImage && typeof (userImage as any) === "object" && typeof (userImage as any).arrayBuffer === "function";
    if (typeof height !== "string" || !hasUserImage) {
      logRequest("POST", "/app/proxy/bould", 400, Date.now() - startTime, {
        requestId,
        error: "Invalid form data",
        hasHeight: typeof height === "string",
        hasUserImage: hasUserImage,
      });
      return json({ error: "Invalid form data. Please provide both height and image.", debug: { requestId } }, { status: 400 });
    }

    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 80 || heightNum > 250) {
      logRequest("POST", "/app/proxy/bould", 400, Date.now() - startTime, {
        requestId,
        error: "Invalid height",
        height: heightNum,
      });
      return json({ error: "Height must be between 80 and 250 cm", debug: { requestId } }, { status: 400 });
    }

    const url = new URL(request.url);
    const productId = url.searchParams.get("product_id");
    const shopDomain = url.searchParams.get("shop") || undefined;
    if (!productId) {
      logRequest("POST", "/app/proxy/bould", 400, Date.now() - startTime, { requestId, error: "Missing product ID" });
      return json({ error: "Product ID is required", debug: { requestId } }, { status: 400 });
    }

    if (shopDomain) {
      try {
        const planContext = await getPlanForShop({ shopDomain });
        const apparelLimit = planContext.plan.capabilities.apparelPreviewLimit ?? null;
        if (apparelLimit != null) {
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
                  correlationId: clientCorrelationId,
                },
              },
              {
                status: 409,
                headers: { "X-Correlation-ID": clientCorrelationId || requestId },
              }
            );
          }
        }
      } catch (planError) {
        logError(planError, "widget proxy plan enforcement", { requestId, shopDomain });
      }
    }

    let isGarmentProcessed = false;
    let conversionStatus = "unknown";
    let conversionRecord: any = null;
    try {
      conversionRecord = await (prisma as any).conversion.findFirst({ where: { shopifyProductId: productId } });
      if (conversionRecord) {
        isGarmentProcessed = conversionRecord.processed === true && conversionRecord.status === "completed";
        conversionStatus = conversionRecord.status;
        logRequest("POST", "/app/proxy/bould", 200, Date.now() - startTime, {
          requestId,
          productId,
          conversionStatus,
          isGarmentProcessed,
          conversionId: conversionRecord.id,
        });
      } else {
        logRequest("POST", "/app/proxy/bould", 200, Date.now() - startTime, {
          requestId,
          productId,
          conversionStatus: "not_found",
          isGarmentProcessed: false,
        });
      }
    } catch (dbError: any) {
      logError(dbError, "database check", { requestId, productId });
      isGarmentProcessed = false;
      conversionStatus = "database_error";
    }

    if (!isGarmentProcessed) {
      const errorMessage =
        conversionStatus === "not_found"
          ? "This garment hasn't been edited."
          : conversionStatus === "processing"
          ? "This garment is currently being processed. Please wait a few minutes and try again."
          : conversionStatus === "failed"
          ? "Garment conversion failed. Please try converting again in the Bould app."
          : "This garment hasn't been edited.";

      logRequest("POST", "/app/proxy/bould", 409, Date.now() - startTime, {
        requestId,
        productId,
        conversionStatus,
        error: "garment_not_processed",
      });

      return json(
        {
          error: errorMessage,
          debug: {
            requestId,
            productId,
            conversionStatus,
            suggestion: "Visit the Bould app to convert this garment first",
            correlationId: clientCorrelationId,
          },
        },
        { status: 409, headers: { "X-Correlation-ID": clientCorrelationId || requestId } }
      );
    }

    // Prepare images for downstream API calls (clone streams to buffers)
    const userBuffer = Buffer.from(await (userImage as any).arrayBuffer());
    const userFileName = (userImage as any).name || "user.jpg";
    const userMime = (userImage as any).type || "image/jpeg";

    // Download garment image from conversion record
    const garmentUrl = productImageUrl || conversionRecord?.imageUrl;
    if (!garmentUrl) {
      return json({ error: "Garment image URL missing for this product", debug: { requestId, productId, productImageUrl } }, { status: 502 });
    }

    const garmentRes = await fetch(garmentUrl);
    if (!garmentRes.ok) {
      return json({ error: "Failed to download garment image", debug: { requestId, productId, status: garmentRes.status, garmentUrl } }, { status: 502 });
    }
    const garmentBuffer = Buffer.from(await garmentRes.arrayBuffer());
    const garmentFileName = garmentUrl.split("/").pop() || "garment.jpg";
    const garmentMime = garmentRes.headers.get("content-type") || "image/jpeg";

    // Orchestrator configuration
    const base = process.env.RECOMMENDER_BASE_URL || process.env.RECOMMENDER_URL || "";
    const apiKey = process.env.RECOMMENDER_API_KEY || process.env.API_KEY || "";

    if (!base || !apiKey) {
      // Fall back to mock if orchestrator not configured
      const tryOnImageUrl = "https://placehold.co/600x800/png?text=Try-on+Result";
      const recommendedSize = heightNum < 165 ? "S" : heightNum < 180 ? "M" : "L";
      const confidence = (Math.random() * 0.3 + 0.7).toFixed(2);
      const tailorFeedback = "This size should fit well based on your measurements. The fit is optimized for your body proportions.";

      const mockResponse = {
        tryOnImageUrl,
        recommended_size: recommendedSize,
        confidence: parseFloat(confidence),
        tailor_feedback: tailorFeedback,
        debug: {
          measurement_vis_url: "https://placehold.co/600x800/png?text=Measurement+Visualization",
          requestId,
          productId,
          conversionStatus,
          correlationId: clientCorrelationId,
          mode: "mock",
        },
      };

      logRequest("POST", "/app/proxy/bould", 200, Date.now() - startTime, {
        requestId,
        productId,
        recommendedSize,
        confidence: parseFloat(confidence),
      });

      await recordWidgetEvent({
        productId,
        conversionId: conversionRecord?.id,
        shopDomain,
        recommendedSize,
        confidence: Number.parseFloat(confidence),
        requestId,
        correlationId: clientCorrelationId,
      });

      return json(mockResponse, { headers: { "X-Correlation-ID": clientCorrelationId || requestId } });
    }

    // Call recommend endpoint
    const recFd = new FormData();
    recFd.append("height", String(heightNum));
    recFd.append("user_image", new Blob([userBuffer], { type: userMime }) as any, userFileName);
    recFd.append("garment_image", new Blob([garmentBuffer], { type: garmentMime }) as any, garmentFileName);
    recFd.append("category_id", String(conversionRecord.categoryId));
    recFd.append("true_size", String(conversionRecord.trueSize));
    recFd.append("unit", String(conversionRecord.unit || "cm"));

    const recRes = await fetch(`${base.replace(/\/$/, "")}/v1/recommend`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: recFd as any,
    });
    if (!recRes.ok) {
      const text = await recRes.text().catch(() => "");
      return json(
        { error: "Recommendation service error", debug: { requestId, status: recRes.status, body: text } },
        { status: 502 }
      );
    }
    const recData = await recRes.json();

    // Call try-on endpoint
    const tryFd = new FormData();
    tryFd.append("user_image", new Blob([userBuffer], { type: userMime }) as any, userFileName);
    tryFd.append("garment_image", new Blob([garmentBuffer], { type: garmentMime }) as any, garmentFileName);

    const tryRes = await fetch(`${base.replace(/\/$/, "")}/v1/try-on`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: tryFd as any,
    });
    if (!tryRes.ok && tryRes.status !== 202) {
      const text = await tryRes.text().catch(() => "");
      return json(
        { error: "Try-on service error", debug: { requestId, status: tryRes.status, body: text } },
        { status: 502 }
      );
    }
    const tryData = await tryRes.json().catch(() => ({}));

    // If provider queues work (nano), bubble up task id so widget can poll
    if (
      tryRes.status === 202 ||
      tryData?.status === "queued" ||
      (tryData?.provider === "nano" && (tryData?.task_id || tryData?.task?.id || tryData?.task?.taskId))
    ) {
      const taskId =
        tryData?.task_id ||
        tryData?.task?.id ||
        tryData?.task?.taskId ||
        tryData?.task?.jobId ||
        tryData?.task?.job_id ||
        tryData?.task?.data?.taskId ||
        tryData?.task?.data?.jobId ||
        tryData?.task?.data?.job_id;
      const queuedResponse = {
        queued: true,
        task_id: taskId,
        provider: "nano",
        recommended_size: recData.recommended_size || recData.recommendedSize,
        confidence: recData.confidence,
        tailor_feedback: recData.tailor_feedback || recData.tailorFeedback,
        debug: { requestId, productId, conversionStatus, correlationId: clientCorrelationId },
      } as any;

      const queuedRecommended = typeof queuedResponse.recommended_size === "string"
        ? queuedResponse.recommended_size
        : typeof queuedResponse.recommended_size === "number"
        ? String(queuedResponse.recommended_size)
        : null;
      const queuedConfidence = typeof queuedResponse.confidence === "number"
        ? queuedResponse.confidence
        : typeof queuedResponse.confidence === "string"
        ? Number.parseFloat(queuedResponse.confidence)
        : null;

      await recordWidgetEvent({
        productId,
        conversionId: conversionRecord?.id,
        shopDomain,
        recommendedSize: queuedRecommended,
        confidence: Number.isFinite(queuedConfidence ?? NaN) ? queuedConfidence : null,
        requestId,
        correlationId: clientCorrelationId,
      });

      logRequest("POST", "/app/proxy/bould", 202, Date.now() - startTime, {
        requestId,
        productId,
        queued: true,
      });
      return json(queuedResponse, { status: 202, headers: { "X-Correlation-ID": clientCorrelationId || requestId } });
    }

    // Otherwise, we have a synchronous result image
    const resultImage = tryData.result_image_url || tryData.url || tryData.tryOnImageUrl || "";
    const tryOnImageUrl = resultImage.startsWith("http") ? resultImage : `${base.replace(/\/$/, "")}${resultImage}`;

    const response = {
      tryOnImageUrl,
      recommended_size: recData.recommended_size || recData.recommendedSize,
      confidence: recData.confidence,
      tailor_feedback: recData.tailor_feedback || recData.tailorFeedback,
      debug: {
        measurement_vis_url: recData?.debug?.measurement_vis_url || "",
        requestId,
        productId,
        conversionStatus,
        correlationId: clientCorrelationId,
        provider: tryData.provider || "mock",
      },
    };

    const recommendedOut = typeof response.recommended_size === "string"
      ? response.recommended_size
      : typeof response.recommended_size === "number"
      ? String(response.recommended_size)
      : null;
    const confidenceOut = typeof response.confidence === "number"
      ? response.confidence
      : typeof response.confidence === "string"
      ? Number.parseFloat(response.confidence)
      : null;

    await recordWidgetEvent({
      productId,
      conversionId: conversionRecord?.id,
      shopDomain,
      recommendedSize: recommendedOut,
      confidence: Number.isFinite(confidenceOut ?? NaN) ? confidenceOut : null,
      requestId,
      correlationId: clientCorrelationId,
    });

    logRequest("POST", "/app/proxy/bould", 200, Date.now() - startTime, {
      requestId,
      productId,
      recommendedSize: response.recommended_size,
      confidence: response.confidence,
    });

    return json(response, { headers: { "X-Correlation-ID": clientCorrelationId || requestId } });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logError(error, "widget proxy action", { requestId, duration });

    return json(
      {
        error: "Internal server error. Please try again later.",
        debug: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 500, headers: { "X-Correlation-ID": request.headers.get("X-Correlation-ID") || requestId } }
    );
  }
};


