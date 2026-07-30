/**
 * ScreenshotUploader — Multi-image upload component with AI OCR extraction
 * Allows drag-drop or click to upload multiple screenshots.
 * Sends images to the server OCR endpoint and appends extracted text to the textarea.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  file: File;
  dataUrl: string;
  status: "pending" | "extracting" | "done" | "error";
  extractedText?: string;
  errorMsg?: string;
}

interface ScreenshotUploaderProps {
  type: "natal" | "transit";
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
  resetKey?: number; // increment to reset all thumbnails
}

export function ScreenshotUploader({
  type,
  onTextExtracted,
  disabled,
  resetKey,
}: ScreenshotUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractMutation = trpc.ocr.extractText.useMutation();

  // Reset thumbnails when resetKey changes
  useEffect(() => {
    setImages([]);
  }, [resetKey]);

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter(f => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      const newImages: UploadedImage[] = await Promise.all(
        imageFiles.map(async file => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          dataUrl: await readFileAsDataUrl(file),
          status: "pending" as const,
        }))
      );

      setImages(prev => [...prev, ...newImages]);

      setImages(prev =>
        prev.map(img =>
          newImages.find(n => n.id === img.id)
            ? { ...img, status: "extracting" }
            : img
        )
      );

      try {
        const dataUrls = newImages.map(img => img.dataUrl);
        const result = await extractMutation.mutateAsync({
          images: dataUrls,
          type,
        });

        setImages(prev =>
          prev.map(img =>
            newImages.find(n => n.id === img.id)
              ? { ...img, status: "done", extractedText: result.text }
              : img
          )
        );

        if (result.text) {
          onTextExtracted(result.text);
          toast.success(
            `Extracted ${type} data from ${newImages.length} screenshot${newImages.length > 1 ? "s" : ""}`
          );
        } else {
          toast.warning(
            "No planetary data found in screenshots. Try a clearer image."
          );
        }
      } catch {
        setImages(prev =>
          prev.map(img =>
            newImages.find(n => n.id === img.id)
              ? { ...img, status: "error", errorMsg: "Extraction failed" }
              : img
          )
        );
        toast.error(
          "Failed to extract data from screenshots. Please try again."
        );
      }
    },
    [type, onTextExtracted, extractMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      processFiles(Array.from(e.dataTransfer.files));
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(Array.from(e.target.files ?? []));
      e.target.value = "";
    },
    [processFiles]
  );

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const hasExtracting = images.some(img => img.status === "extracting");

  return (
    <div style={{ marginTop: "10px" }}>
      {/* Drop zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: `1px dashed ${isDragging ? "var(--ember)" : "var(--rim)"}`,
          borderRadius: "3px",
          padding: "12px 16px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: isDragging ? "rgba(200,146,58,0.04)" : "transparent",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => {
          if (!disabled) e.currentTarget.style.borderColor = "var(--ice)";
        }}
        onMouseLeave={e => {
          if (!isDragging) e.currentTarget.style.borderColor = "var(--rim)";
        }}
      >
        <div style={{ fontSize: "16px", opacity: 0.6 }}>📷</div>
        <div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "10px",
              letterSpacing: "2px",
              color: "var(--ember)",
              marginBottom: "2px",
            }}
          >
            {hasExtracting ? "READING SCREENSHOTS..." : "UPLOAD SCREENSHOTS"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--silver-dim)",
              fontStyle: "italic",
            }}
          >
            {hasExtracting
              ? "AI is extracting planetary data..."
              : "Drag & drop or click · Multiple images supported"}
          </div>
        </div>
        {hasExtracting && (
          <div
            style={{
              marginLeft: "auto",
              width: "20px",
              height: "20px",
              border: "1px solid var(--rim)",
              borderTopColor: "var(--ember)",
              borderRadius: "50%",
              animation: "spin 1.2s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileInput}
      />

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          {images.map(img => (
            <div
              key={img.id}
              style={{
                position: "relative",
                width: "64px",
                height: "64px",
                borderRadius: "3px",
                overflow: "hidden",
                border: `1px solid ${
                  img.status === "done"
                    ? "rgba(100,200,100,0.3)"
                    : img.status === "error"
                      ? "rgba(200,80,80,0.3)"
                      : img.status === "extracting"
                        ? "var(--ember-dim)"
                        : "var(--rim)"
                }`,
                flexShrink: 0,
              }}
            >
              <img
                src={img.dataUrl}
                alt="screenshot"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {img.status === "extracting" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(8,13,20,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "1px solid var(--rim)",
                      borderTopColor: "var(--ember)",
                      borderRadius: "50%",
                      animation: "spin 1.2s linear infinite",
                    }}
                  />
                </div>
              )}
              {img.status === "done" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    background: "rgba(60,160,60,0.8)",
                    borderRadius: "50%",
                    width: "14px",
                    height: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "#fff",
                  }}
                >
                  ✓
                </div>
              )}
              {img.status === "error" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    background: "rgba(160,60,60,0.8)",
                    borderRadius: "50%",
                    width: "14px",
                    height: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "#fff",
                  }}
                >
                  ✕
                </div>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                  background: "rgba(8,13,20,0.8)",
                  border: "none",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  color: "var(--silver-dim)",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e =>
                  (e.currentTarget.style.color = "var(--silver-dim)")
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
