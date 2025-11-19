import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

// This route handles the storefront widget submission.
// It calls two backend services in sequence:
// 1) Body measurements API (user image + height) → measurements JSON
// 2) Try-on API (user image + garment image) → composite URL
// For now, we mock the response so the widget can be end-to-end tested.

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const height = formData.get("height");
    const userImage = formData.get("user_image");

    if (typeof height !== "string" || !(userImage instanceof File)) {
      return json({ error: "Invalid form data" }, { status: 400 });
    }

    // TODO: Wire to real services. Example sketch:
    // const orchestrator = process.env.RECOMMENDER_URL || 'http://localhost:8100';
    // const apiKey = process.env.API_KEY || 'change-me';
    // 1) maybe get measurements (or directly use orchestrator /v1/recommend)
    // 2) call orchestrator /v1/try-on with the same image + product image URL

    // Mock result
    const tryOnImageUrl = "https://placehold.co/600x800/png?text=Try-on";

    const heightNum = parseFloat(height);
    let recommendedSize = "M";
    let confidence = 0.8;
    let matchDetails = {};

    if (!isNaN(heightNum)) {
      const { simulateBodyMeasurements, fetchGarmentScale, recommendSize } = await import("../services/recommendation_engine");

      // Simulate getting body measurements from the image (mocked)
      const body = await simulateBodyMeasurements(userImage as File, heightNum, 'cm');

      // Simulate getting garment scale
      const scale = await fetchGarmentScale("mock-product-id");

      // Calculate recommendation
      const result = recommendSize(body, scale);
      recommendedSize = result.recommendedSize;
      confidence = result.confidence;
      matchDetails = result.matchDetails || {};
    }

    return json({ tryOnImageUrl, recommendedSize, confidence, matchDetails });
  } catch (error: any) {
    return json({ error: error?.message || "Server error" }, { status: 500 });
  }
};

export const loader = async () => json({ ok: true });


