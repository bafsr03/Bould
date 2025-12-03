
export interface BodyMeasurements {
    height: number;
    waist: number;
    belly: number;
    chest: number;
    wrist: number;
    neck: number;
    arm_length: number;
    thigh: number;
    shoulder_width: number;
    hips: number;
    ankle: number;
    unit: 'cm' | 'inch';
}

export interface GarmentMeasurement {
    [key: string]: number; // e.g. chest: 100, waist: 80
}

export interface GarmentSizeScale {
    [size: string]: GarmentMeasurement; // e.g. "M": { chest: 100 }
}

export interface RecommendationResult {
    recommendedSize: string;
    confidence: number;
    details: string;
    matchDetails?: {
        [key: string]: number; // difference between body and garment
    };
}

// Ease allowances (cm) - how much bigger the garment should be than the body
const EASE_ALLOWANCE = {
    chest: 4,
    waist: 2,
    hips: 4,
    default: 2
};

export function convertToCm(value: number, unit: 'cm' | 'inch'): number {
    return unit === 'inch' ? value * 2.54 : value;
}

export function normalizeBodyMeasurements(measurements: BodyMeasurements): BodyMeasurements {
    if (measurements.unit === 'cm') return measurements;

    return {
        height: convertToCm(measurements.height, 'inch'),
        waist: convertToCm(measurements.waist, 'inch'),
        belly: convertToCm(measurements.belly, 'inch'),
        chest: convertToCm(measurements.chest, 'inch'),
        wrist: convertToCm(measurements.wrist, 'inch'),
        neck: convertToCm(measurements.neck, 'inch'),
        arm_length: convertToCm(measurements.arm_length, 'inch'),
        thigh: convertToCm(measurements.thigh, 'inch'),
        shoulder_width: convertToCm(measurements.shoulder_width, 'inch'),
        hips: convertToCm(measurements.hips, 'inch'),
        ankle: convertToCm(measurements.ankle, 'inch'),
        unit: 'cm'
    };
}

export function recommendSize(
    bodyRaw: BodyMeasurements,
    garmentScale: GarmentSizeScale
): RecommendationResult {
    const body = normalizeBodyMeasurements(bodyRaw);
    let bestSize = "M"; // Default fallback
    let bestScore = Infinity;
    let matchDetails = {};

    // Filter out sizes that are definitely too small
    const validSizes = Object.entries(garmentScale).filter(([size, measurements]) => {
        // Check critical measurements if they exist in both
        const chestOk = !measurements.chest || measurements.chest >= body.chest;
        const waistOk = !measurements.waist || measurements.waist >= body.waist;
        const hipsOk = !measurements.hips || measurements.hips >= body.hips;
        return chestOk && waistOk && hipsOk;
    });

    // If no size is big enough, pick the largest available
    const candidates = validSizes.length > 0 ? validSizes : Object.entries(garmentScale);

    for (const [size, measurements] of candidates) {
        let totalDiff = 0;
        let count = 0;
        const currentDetails: any = {};

        // Compare relevant keys
        const keysToCompare = ['chest', 'waist', 'hips', 'shoulder_width'];

        for (const key of keysToCompare) {
            if (measurements[key] && (body as any)[key]) {
                const diff = measurements[key] - (body as any)[key];
                const ease = (EASE_ALLOWANCE as any)[key] || EASE_ALLOWANCE.default;

                // We want diff to be close to ease. 
                // If diff < 0, it's too tight (penalty).
                // If diff > ease, it's loose (penalty, but less severe than tight).

                let penalty = 0;
                if (diff < 0) {
                    penalty = Math.abs(diff) * 5; // Heavy penalty for being too small
                } else {
                    penalty = Math.abs(diff - ease);
                }

                totalDiff += penalty;
                count++;
                currentDetails[key] = parseFloat(diff.toFixed(1));
            }
        }

        if (count > 0) {
            const avgScore = totalDiff / count;
            if (avgScore < bestScore) {
                bestScore = avgScore;
                bestSize = size;
                matchDetails = currentDetails;
            }
        }
    }

    // Calculate confidence based on score (lower score is better)
    // Score 0 = perfect match. Score 10 = okay. Score > 20 = bad.
    let confidence = Math.max(0, 100 - (bestScore * 2));
    if (validSizes.length === 0) confidence *= 0.5; // Low confidence if nothing actually fits

    return {
        recommendedSize: bestSize,
        confidence: parseFloat(confidence.toFixed(1)),
        details: `Based on your measurements, size ${bestSize} provides the best fit.`,
        matchDetails
    };
}

// Mock function to simulate the Computer Vision API
export async function simulateBodyMeasurements(image: File | Blob, height: number, unit: 'cm' | 'inch'): Promise<BodyMeasurements> {
    // In a real implementation, this would upload the image to the CV API
    // For now, we generate plausible measurements based on height

    // If unit is inch, height is already in inches.
    // We need height in cm for the estimation formulas which are based on cm.
    const heightCm = unit === 'inch' ? height * 2.54 : height;

    // Simple estimation ratios (average human proportions)
    // We calculate in CM first
    const measurementsCm = {
        height: heightCm,
        chest: heightCm * 0.58 + (Math.random() * 10 - 5),
        waist: heightCm * 0.45 + (Math.random() * 10 - 5),
        hips: heightCm * 0.55 + (Math.random() * 10 - 5),
        shoulder_width: heightCm * 0.25,
        arm_length: heightCm * 0.35,
        thigh: heightCm * 0.30,
        neck: heightCm * 0.22,
        belly: heightCm * 0.48,
        wrist: heightCm * 0.10,
        ankle: heightCm * 0.12,
    };

    // If requested unit is inch, convert back to inch for the return value
    // so that normalizeBodyMeasurements doesn't double-convert
    if (unit === 'inch') {
        return {
            height: height, // Original input
            chest: measurementsCm.chest / 2.54,
            waist: measurementsCm.waist / 2.54,
            hips: measurementsCm.hips / 2.54,
            shoulder_width: measurementsCm.shoulder_width / 2.54,
            arm_length: measurementsCm.arm_length / 2.54,
            thigh: measurementsCm.thigh / 2.54,
            neck: measurementsCm.neck / 2.54,
            belly: measurementsCm.belly / 2.54,
            wrist: measurementsCm.wrist / 2.54,
            ankle: measurementsCm.ankle / 2.54,
            unit: 'inch'
        };
    }

    return {
        ...measurementsCm,
        unit: 'cm'
    };
}

// Mock function to simulate Garment API
export async function fetchGarmentScale(productId: string): Promise<GarmentSizeScale> {
    // In real implementation, fetch from Automatic-Garments-Size-Measurement API
    return {
        "XS": { chest: 88, waist: 70, hips: 88, shoulder_width: 40 },
        "S": { chest: 96, waist: 78, hips: 96, shoulder_width: 42 },
        "M": { chest: 104, waist: 86, hips: 104, shoulder_width: 44 },
        "L": { chest: 112, waist: 94, hips: 112, shoulder_width: 46 },
        "XL": { chest: 120, waist: 102, hips: 120, shoulder_width: 48 },
        "XXL": { chest: 128, waist: 110, hips: 128, shoulder_width: 50 }
    };
}
