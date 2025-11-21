import { useState, useCallback, useEffect } from "react";
import {
    BlockStack,
    InlineStack,
    Button,
    Text,
    TextField,
    Box,
    Banner,
    Badge,
    Select,
    Card,
} from "@shopify/polaris";

// Tone presets with descriptions and sample output
const TONE_PRESETS = [
    {
        id: "friendly",
        label: "Friendly",
        tone: "Warm, welcoming, and conversational. Use casual language and emojis when appropriate. Make the customer feel supported.",
        sample: "Great choice! 👕 We recommend size M for you. It'll give you that perfect relaxed fit you're looking for.",
    },
    {
        id: "professional",
        label: "Professional",
        tone: "Polished, concise, and authoritative. Use clear, direct language. Focus on accuracy and expertise.",
        sample: "Based on your measurements, size M is recommended. This selection offers optimal proportions for your body type.",
    },
    {
        id: "luxury",
        label: "Luxury",
        tone: "Sophisticated, elegant, and refined. Emphasize craftsmanship, exclusivity, and premium quality.",
        sample: "We suggest size M to ensure an impeccable fit that complements your silhouette with refined elegance.",
    },
    {
        id: "eco",
        label: "Eco-Conscious",
        tone: "Sustainable, mindful, and authentic. Highlight conscious choices and environmental awareness.",
        sample: "Size M is your mindful match. The right fit means you'll love and wear this piece for years to come.",
    },
    {
        id: "technical",
        label: "Technical",
        tone: "Data-driven, precise, and detailed. Include specific measurements and technical specifications.",
        sample: "Size M recommended (chest: 104cm, waist: 86cm). Measurements indicate 94% compatibility with your body dimensions.",
    },
    {
        id: "casual",
        label: "Casual",
        tone: "Laid-back, simple, and straightforward. Keep it short and easy to understand.",
        sample: "Size M looks perfect for you. Nice and comfy!",
    },
];

interface Props {
    value: string;
    onChange: (tone: string) => void;
    onClose: () => void;
    selectedProduct?: {
        title: string;
        productType?: string;
    } | null;
}

export default function ToneEditor({
    value,
    onChange,
    onClose,
    selectedProduct,
}: Props) {
    const [customTone, setCustomTone] = useState(value);
    const [selectedPreset, setSelectedPreset] = useState<string>("");
    const [validation, setValidation] = useState<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>({ isValid: true, errors: [], warnings: [] });

    // Validate tone on change
    useEffect(() => {
        validateTone(customTone);
    }, [customTone]);

    const validateTone = (text: string) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Length validation
        if (text.length > 500) {
            errors.push("Tone specification is too long (max 500 characters)");
        }
        if (text.length > 0 && text.length < 10) {
            warnings.push("Tone is very short. Consider adding more detail.");
        }

        // Profanity check (basic)
        const profanityPattern = /\b(fuck|shit|damn|ass|bitch)\b/i;
        if (profanityPattern.test(text)) {
            errors.push("Please avoid profanity in your tone specification");
        }

        // Disallowed phrases
        const disallowed = ["guarantee", "100% accurate", "never wrong", "always perfect"];
        disallowed.forEach(phrase => {
            if (text.toLowerCase().includes(phrase)) {
                warnings.push(`Avoid absolute claims like "${phrase}"`);
            }
        });

        setValidation({
            isValid: errors.length === 0,
            errors,
            warnings,
        });
    };

    const handlePresetSelect = useCallback((presetId: string) => {
        setSelectedPreset(presetId);
        const preset = TONE_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setCustomTone(preset.tone);
        }
    }, []);

    const handleSave = useCallback(() => {
        if (validation.isValid) {
            onChange(customTone);
            onClose();
        }
    }, [customTone, validation.isValid, onChange, onClose]);

    const selectedPresetData = TONE_PRESETS.find(p => p.id === selectedPreset);

    return (
        <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
                Customize Recommendation Tone
            </Text>

            <Text as="p" tone="subdued">
                Define how size recommendations should be communicated to your customers. Choose a preset or create a custom tone.
            </Text>

            {/* Preset Library */}
            <Card>
                <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingSm">
                            Tone Library
                        </Text>
                        <Badge tone="info">Pro Feature</Badge>
                    </InlineStack>

                    <Select
                        label="Select a preset"
                        options={[
                            { label: "Choose a preset...", value: "" },
                            ...TONE_PRESETS.map(p => ({ label: p.label, value: p.id })),
                        ]}
                        value={selectedPreset}
                        onChange={handlePresetSelect}
                    />

                    {/* Live Preview */}
                    {selectedPresetData && (
                        <Box
                            background="bg-surface-secondary"
                            padding="300"
                            borderRadius="200"
                        >
                            <BlockStack gap="200">
                                <Text as="p" variant="bodySm" fontWeight="semibold">
                                    Sample recommendation:
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                    {selectedPresetData.sample}
                                </Text>
                            </BlockStack>
                        </Box>
                    )}
                </BlockStack>
            </Card>

            {/* Custom Tone Input */}
            <Card>
                <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                        Custom Tone Specification
                    </Text>

                    <TextField
                        label="Tone description"
                        value={customTone}
                        onChange={setCustomTone}
                        multiline={6}
                        autoComplete="off"
                        placeholder="e.g., Friendly and encouraging, professional yet approachable. Use positive language and make customers feel confident in their choice."
                        helpText={`${customTone.length}/500 characters`}
                        showCharacterCount
                        maxLength={500}
                    />

                    {/* Validation Messages */}
                    {validation.errors.length > 0 && (
                        <Banner tone="critical">
                            <BlockStack gap="100">
                                {validation.errors.map((error, i) => (
                                    <Text as="p" key={i}>
                                        {error}
                                    </Text>
                                ))}
                            </BlockStack>
                        </Banner>
                    )}

                    {validation.warnings.length > 0 && (
                        <Banner tone="warning">
                            <BlockStack gap="100">
                                {validation.warnings.map((warning, i) => (
                                    <Text as="p" key={i}>
                                        {warning}
                                    </Text>
                                ))}
                            </BlockStack>
                        </Banner>
                    )}
                </BlockStack>
            </Card>

            {/* Live Preview with Product Context */}
            {customTone && (
                <Card>
                    <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">
                            Live Preview
                        </Text>
                        <Box
                            background="bg-surface-secondary"
                            padding="400"
                            borderRadius="200"
                        >
                            <BlockStack gap="300">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    Preview for {selectedProduct?.title || "this product"}:
                                </Text>
                                <Text as="p" tone="subdued">
                                    Your size is M – {generateSampleFeedback(customTone)}
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                    Note: This is a simulated preview. Actual recommendations will be generated based on customer measurements.
                                </Text>
                            </BlockStack>
                        </Box>
                    </BlockStack>
                </Card>
            )}

            {/* Actions */}
            <InlineStack gap="200" align="end">
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!validation.isValid || !customTone}
                >
                    Save Tone
                </Button>
            </InlineStack>
        </BlockStack>
    );
}

// Generate sample feedback based on tone
function generateSampleFeedback(tone: string): string {
    const lowerTone = tone.toLowerCase();

    if (lowerTone.includes("friendly") || lowerTone.includes("warm")) {
        return "perfect for a relaxed, comfortable fit! 😊";
    } else if (lowerTone.includes("professional") || lowerTone.includes("formal")) {
        return "providing optimal proportions for your body type.";
    } else if (lowerTone.includes("luxury") || lowerTone.includes("elegant")) {
        return "ensuring an impeccable fit that complements your silhouette.";
    } else if (lowerTone.includes("eco") || lowerTone.includes("sustainable")) {
        return "a mindful choice that you'll love for years to come.";
    } else if (lowerTone.includes("technical") || lowerTone.includes("data")) {
        return "with 94% compatibility based on your body dimensions.";
    } else if (lowerTone.includes("casual") || lowerTone.includes("simple")) {
        return "nice and comfy!";
    }

    return "based on your measurements, this should fit well.";
}
