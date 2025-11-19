
export function calculateRecommendedSize(heightCm: number): string {
    if (heightCm < 160) return "XS";
    if (heightCm < 170) return "S";
    if (heightCm < 180) return "M";
    if (heightCm < 190) return "L";
    if (heightCm < 200) return "XL";
    return "XXL";
}

export function normalizeSize(size: string | null | undefined): string | null {
    if (!size) return null;
    const s = size.toUpperCase().trim();
    if (["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].includes(s)) {
        return s;
    }
    return size; // Return original if not a standard size (e.g. numeric)
}
