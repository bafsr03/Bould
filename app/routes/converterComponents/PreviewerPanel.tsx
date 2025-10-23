import { useEffect, useMemo, useState } from "react";
import { Card, Text, Box, ButtonGroup, Button, InlineStack } from "@shopify/polaris";
import { useSubmit } from "@remix-run/react";

export interface Props {
  productId?: string | null;
  imageUrl?: string | null;
  sizeScaleUrl?: string | null;
  statusLabel?: string;
}

const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","ONEFIT"] as const;

const Previewer: React.FC<Props> = ({ productId, imageUrl, sizeScaleUrl, statusLabel }) => {
  const submit = useSubmit();
  const [scaleData, setScaleData] = useState<any | null>(null);
  const [scaleError, setScaleError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!sizeScaleUrl) {
        setScaleData(null);
        setScaleError(null);
        return;
      }
      try {
        setScaleError(null);
        const res = await fetch(sizeScaleUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!aborted) setScaleData(json);
      } catch (e: any) {
        if (!aborted) {
          setScaleData(null);
          setScaleError(e?.message || "Failed to load size scale");
        }
      }
    }
    load();
    return () => { aborted = true; };
  }, [sizeScaleUrl]);

  const sizeOrder = useMemo(() => {
    if (!scaleData?.scale || typeof scaleData.scale !== "object") return [] as string[];
    const sizes = Object.keys(scaleData.scale);
    return [...sizes].sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a as any);
      const ib = SIZE_ORDER.indexOf(b as any);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [scaleData]);

  const measurementKeys = useMemo(() => {
    if (!scaleData?.scale || typeof scaleData.scale !== "object") return [] as string[];
    const first = sizeOrder.find((s) => scaleData.scale[s]);
    return first ? Object.keys(scaleData.scale[first] || {}) : [];
  }, [scaleData, sizeOrder]);
  const handleDelete = () => {
    if (!productId) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("productId", productId);
    submit(fd, { method: "post" });
  };
  return (
    <Card>
      <Box padding="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h2">
            Preview
          </Text>
          <ButtonGroup>
            <Button variant="primary" tone="critical" onClick={handleDelete} disabled={!productId}>Delete</Button>
          </ButtonGroup>
        </InlineStack>
      </Box>

      <Box
        minHeight="320px"
        background="bg-surface-secondary"
        padding="300"
        borderRadius="200"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
        ) : (
          <Text as="p" variant="bodyMd">
            {statusLabel || "Your preview 3D apparel will appear here."}
          </Text>
        )}
      </Box>

      {sizeScaleUrl && (
        <Box padding="300">
          <Text as="h3" variant="headingSm">Size scale</Text>
          <Box paddingBlockStart="200">
            {!scaleData && !scaleError && (
              <Text as="p" tone="subdued">Loading size scale…</Text>
            )}
            {scaleError && (
              <Text as="p" tone="critical">{scaleError}</Text>
            )}
            {scaleData && measurementKeys.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #E1E3E5" }}>Measurement ({scaleData.unit || "cm"})</th>
                      {sizeOrder.map((sz) => (
                        <th key={sz} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #E1E3E5" }}>{sz}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measurementKeys.map((k) => (
                      <tr key={k}>
                        <td style={{ padding: 8, borderBottom: "1px solid #F1F2F3" }}>{k}</td>
                        {sizeOrder.map((sz) => (
                          <td key={`${k}-${sz}`} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid #F1F2F3" }}>
                            {scaleData?.scale?.[sz]?.[k] ?? "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {scaleData && measurementKeys.length === 0 && (
              <Text as="p" tone="subdued">No measurements available.</Text>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default Previewer;
