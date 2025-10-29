import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";
import { prisma } from "../db.server";

// Debug endpoint to check garment conversion status
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    await unauthenticated.public.appProxy(request);
    
    const url = new URL(request.url);
    const productId = url.searchParams.get("product_id");
    
    if (!productId) {
      return json({ 
        error: "Product ID is required",
        debug: { requestId }
      }, { status: 400 });
    }

    // Get conversion status from database
    let conversion = null;
    let dbError = null;
    
    try {
      conversion = await (prisma as any).conversion.findFirst({ 
        where: { shopifyProductId: productId } 
      });
    } catch (error: any) {
      dbError = error.message;
      console.error(`[DEBUG] Database error for product ${productId}:`, error);
    }

    const duration = Date.now() - startTime;
    
    const response = {
      requestId,
      productId,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      conversion: conversion ? {
        id: conversion.id,
        status: conversion.status,
        processed: conversion.processed,
        title: conversion.title,
        categoryId: conversion.categoryId,
        trueSize: conversion.trueSize,
        createdAt: conversion.createdAt,
        updatedAt: conversion.updatedAt
      } : null,
      isProcessed: conversion ? (conversion.processed === true && conversion.status === 'completed') : false,
      dbError,
      recommendations: conversion ? {
        needsConversion: !conversion || conversion.status === 'not_found',
        isProcessing: conversion.status === 'processing',
        hasFailed: conversion.status === 'failed',
        isCompleted: conversion.processed === true && conversion.status === 'completed'
      } : {
        needsConversion: true,
        isProcessing: false,
        hasFailed: false,
        isCompleted: false
      }
    };

    console.log(`[DEBUG] Garment status check for product ${productId}:`, response);
    
    return json(response);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[DEBUG] Error checking garment status:`, error);
    
    return json({ 
      error: "Failed to check garment status",
      debug: { 
        requestId,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        error: error.message
      }
    }, { status: 500 });
  }
};
