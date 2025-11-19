
import { BodyMeasurements, GarmentSizeScale, RecommendationResult, normalizeBodyMeasurements, recommendSize } from './recommendation_engine';

// Environment variables for API URLs (with defaults for local dev)
const BODY_MEASUREMENT_API_URL = process.env.BODY_MEASUREMENT_API_URL || 'http://localhost:8001/api/v1';
const GARMENT_MEASUREMENT_API_URL = process.env.GARMENT_MEASUREMENT_API_URL || 'http://localhost:8000/v1';

// Helper to fetch with timeout
async function fetchWithTimeout(resource: string, options: any = {}) {
    const { timeout = 30000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export async function getBodyMeasurements(image: File | Blob, height: number, unit: 'cm' | 'inch'): Promise<BodyMeasurements> {
    try {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('height', String(height));

        // Note: The Human-Body-Measurements API might expect different field names. 
        // Based on inference.py, it seems to take an image and height.
        // We'll assume the API wrapper exposes a standard endpoint.
        // If not, we might need to adjust this.

        const response = await fetchWithTimeout(`${BODY_MEASUREMENT_API_URL}/measure`, {
            method: 'POST',
            body: formData as any,
        });

        if (!response.ok) {
            throw new Error(`Body measurement API failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Map API response to BodyMeasurements interface
        // Assuming the API returns a dictionary of measurements
        return {
            height: height,
            waist: data.waist,
            belly: data.belly,
            chest: data.chest,
            wrist: data.wrist,
            neck: data.neck,
            arm_length: data['arm length'] || data.arm_length,
            thigh: data.thigh,
            shoulder_width: data['shoulder width'] || data.shoulder_width,
            hips: data.hips,
            ankle: data.ankle,
            unit: 'cm' // The python script seems to output in cm (multiplied by 100 in calc_measure)
        };
    } catch (error) {
        console.error("Failed to get real body measurements:", error);
        throw error;
    }
}

export async function getGarmentScale(
    garmentImage: Blob,
    categoryId: number,
    trueSize: string,
    trueWaist?: number
): Promise<GarmentSizeScale> {
    try {
        // First, get the auth token
        const tokenRes = await fetchWithTimeout(`${GARMENT_MEASUREMENT_API_URL}/auth/token`, { method: 'POST' });
        if (!tokenRes.ok) throw new Error("Failed to get garment API token");
        const { token } = await tokenRes.json();

        const formData = new FormData();
        formData.append('image', garmentImage);
        formData.append('category_id', String(categoryId));
        formData.append('true_size', trueSize);
        if (trueWaist) formData.append('true_waist', String(trueWaist));
        formData.append('unit', 'cm');

        const response = await fetchWithTimeout(`${GARMENT_MEASUREMENT_API_URL}/process`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData as any
        });

        if (!response.ok) {
            throw new Error(`Garment measurement API failed: ${response.statusText}`);
        }

        const data = await response.json();

        // The API returns a path to a JSON file with the size scale. 
        // We need to fetch that JSON file.
        // Response format: { measurement_vis: "...", size_scale: "..." }

        if (data.size_scale) {
            // The path returned might be relative or absolute. 
            // The API has a /files endpoint to serve these.
            // We need to construct the URL to fetch the file.
            // Assuming the path returned is relative to the api_runs directory or similar.
            // Let's try to use the /files endpoint.

            const fileUrl = `${GARMENT_MEASUREMENT_API_URL}/files?path=${encodeURIComponent(data.size_scale)}`;
            const fileRes = await fetchWithTimeout(fileUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!fileRes.ok) throw new Error("Failed to fetch size scale JSON file");
            return await fileRes.json();
        }

        throw new Error("No size scale returned from garment API");

    } catch (error) {
        console.error("Failed to get garment scale:", error);
        throw error;
    }
}

// Re-export core logic
export { recommendSize, normalizeBodyMeasurements };
export type { BodyMeasurements, GarmentSizeScale, RecommendationResult };
