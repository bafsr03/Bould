import { useEffect, useMemo, useState } from "react";
import { Card, Text, Box, ButtonGroup, Button, InlineStack, Badge } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import type { action as converterAction } from "../app.converter";

export interface Props {
  productId?: string | null;
  imageUrl?: string | null;
  sizeScaleUrl?: string | null;
  statusLabel?: string;
  onConversionUpdate?: (productId: string, conversionData: any) => void;
}

const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","ONEFIT"] as const;

const Previewer: React.FC<Props> = ({ productId, imageUrl, sizeScaleUrl, statusLabel, onConversionUpdate }) => {
  const deleteFetcher = useFetcher<typeof converterAction>();
  const [scaleData, setScaleData] = useState<any | null>(null);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<"cm" | "inch">("cm");

  const isDeleting = deleteFetcher.state !== "idle";
  const statusDisplay = useMemo(() => {
    if (!statusLabel) return null;
    const normalized = statusLabel.replace(/_/g, " ");
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [statusLabel]);

  useEffect(() => {
    const payload = deleteFetcher.data;
    if (!payload || !onConversionUpdate) return;
    const { productId: payloadId, conversion } = payload as any;
    if (!payloadId || !conversion) return;
    onConversionUpdate(payloadId, conversion);
  }, [deleteFetcher.data, onConversionUpdate]);

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

  // Determine which scale to use based on displayUnit
  const activeScale = useMemo(() => {
    if (!scaleData) return null;
    if (displayUnit === "inch" && scaleData.scale_in) return scaleData.scale_in;
    if (displayUnit === "cm" && scaleData.scale_cm) return scaleData.scale_cm;
    // Fallback to legacy scale
    return scaleData.scale || null;
  }, [scaleData, displayUnit]);

  const sizeOrder = useMemo(() => {
    if (!activeScale || typeof activeScale !== "object") return [] as string[];
    const sizes = Object.keys(activeScale);
    return [...sizes].sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a as any);
      const ib = SIZE_ORDER.indexOf(b as any);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [activeScale]);

  const measurementKeys = useMemo(() => {
    if (!activeScale || typeof activeScale !== "object") return [] as string[];
    const first = sizeOrder.find((s) => activeScale[s]);
    return first ? Object.keys(activeScale[first] || {}) : [];
  }, [activeScale, sizeOrder]);
  
  const handleDelete = () => {
    if (!productId) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("productId", productId);
    deleteFetcher.submit(fd, { method: "post" });
  };

  const openFullscreen = () => {
    if (previewSrc) {
      setIsFullscreen(true);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        closeFullscreen();
      }
    };
    
    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  const renderImage = () => {
    if (imageError) {
      return (
        <Text as="p" variant="bodyMd" tone="critical" alignment="center">
          {imageError}
        </Text>
      );
    }

    if (imageUrl && !previewSrc) {
      return (
        <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
          Loading preview…
        </Text>
      );
    }

    if (previewSrc) {
      return (
        <div
          onClick={openFullscreen}
          style={{
            position: "relative",
            cursor: "pointer",
            display: "inline-block",
            margin: "0 auto",
            maxWidth: "280px",
          }}
        >
          <img
            src={previewSrc}
            alt="Processed preview - Click to enlarge"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 12,
              display: "block",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
              border: "2px solid rgba(255, 255, 255, 0.8)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)";
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(8px)",
              opacity: 0,
              transition: "opacity 0.3s ease",
            }}
            className="fullscreen-hint"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Click to enlarge
          </div>
          <style>{`
            div:hover .fullscreen-hint {
              opacity: 1 !important;
            }
          `}</style>
        </div>
      );
    }

    return (
      <Text as="p" variant="bodyMd" alignment="center">
        {statusLabel || "Your processed garment preview will appear here once ready."}
      </Text>
    );
  };

  useEffect(() => {
    let revokeUrl: string | null = null;
    let cancelled = false;

    if (!imageUrl) {
      setPreviewSrc(null);
      setImageError(null);
      return () => {
        if (revokeUrl) URL.revokeObjectURL(revokeUrl);
      };
    }

    setImageError(null);
    setPreviewSrc(null);

    (async () => {
      try {
        const res = await fetch(imageUrl, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Preview unavailable (HTTP ${res.status})`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        revokeUrl = URL.createObjectURL(blob);
        setPreviewSrc(revokeUrl);
      } catch (err: any) {
        if (cancelled) return;
        setImageError(err?.message || "Failed to load preview");
      }
    })();

    return () => {
      cancelled = true;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [imageUrl]);
  return (
    <>
      <Card>
        <Box padding="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h2">
              Preview
            </Text>
            <ButtonGroup>
              <Button variant="primary" tone="critical" onClick={handleDelete} disabled={!productId || isDeleting} loading={isDeleting}>Delete</Button>
            </ButtonGroup>
          </InlineStack>
        </Box>

        <Box
          minHeight="320px"
          background="bg-surface-secondary"
          padding="300"
          borderRadius="200"
        >
          {statusDisplay && (
            <Box paddingBlockEnd="200">
              <Badge tone="info">{statusDisplay}</Badge>
            </Box>
          )}
          {renderImage()}
        </Box>

        {sizeScaleUrl && (
          <Box padding="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingSm">Size scale</Text>
              {scaleData && (scaleData.scale_cm || scaleData.scale_in) && (
                <ButtonGroup variant="segmented">
                  <Button
                    pressed={displayUnit === "cm"}
                    onClick={() => setDisplayUnit("cm")}
                    disabled={!scaleData.scale_cm}
                  >
                    CM
                  </Button>
                  <Button
                    pressed={displayUnit === "inch"}
                    onClick={() => setDisplayUnit("inch")}
                    disabled={!scaleData.scale_in}
                  >
                    Inch
                  </Button>
                </ButtonGroup>
              )}
            </InlineStack>
            <Box paddingBlockStart="200">
              {!scaleData && !scaleError && (
                <Text as="p" tone="subdued">Loading size scale…</Text>
              )}
              {scaleError && (
                <Text as="p" tone="critical">{scaleError}</Text>
              )}
              {scaleData && measurementKeys.length > 0 && (
                <div style={{ 
                  overflowX: "auto", 
                  WebkitOverflowScrolling: "touch",
                  border: "1px solid #E1E3E5",
                  borderRadius: "8px"
                }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse",
                    minWidth: "600px"
                  }}>
                    <thead>
                      <tr>
                        <th style={{ 
                          textAlign: "left", 
                          padding: "12px 8px", 
                          borderBottom: "1px solid #E1E3E5",
                          backgroundColor: "#F6F6F7",
                          position: "sticky",
                          left: 0,
                          zIndex: 1
                        }}>
                          Measurement ({displayUnit})
                        </th>
                        {sizeOrder.map((sz) => {
                          const isTrueSize = scaleData?.true_size?.toUpperCase() === sz.toUpperCase();
                          return (
                            <th key={sz} style={{ 
                              textAlign: "center", 
                              padding: "12px 8px", 
                              borderBottom: "1px solid #E1E3E5",
                              backgroundColor: isTrueSize ? "#D4E9FF" : "#F6F6F7",
                              fontWeight: isTrueSize ? "600" : "normal",
                              minWidth: "80px"
                            }}>
                              {sz}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {measurementKeys.map((k) => (
                        <tr key={k}>
                          <td style={{ 
                            padding: "12px 8px", 
                            borderBottom: "1px solid #F1F2F3",
                            backgroundColor: "#F6F6F7",
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            fontWeight: "500"
                          }}>
                            {k}
                          </td>
                          {sizeOrder.map((sz) => {
                            const isTrueSize = scaleData?.true_size?.toUpperCase() === sz.toUpperCase();
                            return (
                              <td key={`${k}-${sz}`} style={{ 
                                textAlign: "center", 
                                padding: "12px 8px", 
                                borderBottom: "1px solid #F1F2F3",
                                backgroundColor: isTrueSize ? "#EAF5FF" : "white",
                                fontWeight: isTrueSize ? "500" : "normal",
                                minWidth: "80px"
                              }}>
                                {(() => {
                                  const value = activeScale?.[sz]?.[k];
                                  if (value === null || value === undefined) return "-";
                                  const num = parseFloat(value);
                                  return isNaN(num) ? value : num.toFixed(2);
                                })()}
                              </td>
                            );
                          })}
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

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && previewSrc && (
        <div
          onClick={closeFullscreen}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.25s ease-out",
            cursor: "zoom-out",
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes scaleIn {
              from {
                transform: scale(0.95);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
          
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              zIndex: 10000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            aria-label="Close fullscreen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Image container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              position: "relative",
              animation: "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "default",
            }}
          >
            <img
              src={previewSrc}
              alt="Measurement visualization - Full screen"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                borderRadius: 16,
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)",
                border: "3px solid rgba(255, 255, 255, 0.1)",
              }}
            />
            
            {/* ESC hint */}
            <div
              style={{
                position: "absolute",
                bottom: -40,
                left: "50%",
                transform: "translateX(-50%)",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              Press ESC or click outside to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Previewer;
