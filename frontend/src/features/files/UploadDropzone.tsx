import { useRef, useState, type DragEvent } from "react";
import {
  MAX_UPLOAD_FILES,
  acceptAttribute,
  allowedExtensions,
  allowedTypesSummary,
} from "@pocket-locker/shared";
import { Equalizer } from "../../components/Equalizer.js";
import { UploadIcon } from "../../components/icons.js";
import { useToast } from "../../components/ToastProvider.js";
import { useFileUpload, type BatchResult } from "./useFileUpload.js";

/** Condense a finished batch into a single toast message. */
function summarize({ uploaded, errors, truncated }: BatchResult): string | null {
  const parts: string[] = [];
  if (uploaded.length === 1) parts.push(`Uploaded ${uploaded[0]}`);
  else if (uploaded.length > 1) parts.push(`Uploaded ${uploaded.length} files`);

  if (errors.length === 1) parts.push(errors[0]);
  else if (errors.length > 1) parts.push(`${errors.length} files failed`);

  if (truncated) parts.push(`max ${MAX_UPLOAD_FILES} files at a time`);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Home-page upload target. Idle: a dashed drop zone (drag/drop or click to
 * browse up to MAX_UPLOAD_FILES files). Active: current filename + batch
 * position, percent, the equalizer + shimmer bar and a cancel button. The batch
 * result is surfaced as a single toast, returning the zone to idle.
 */
export function UploadDropzone() {
  const { status, progress, etaSeconds, fileName, index, total, uploadMany, cancel } =
    useFileUpload();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const busy = status === "uploading" || status === "finalizing";

  const handleFiles = async (fileList: FileList | null) => {
    if (busy) return;
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    const result = await uploadMany(files);
    const message = summarize(result);
    if (message) showToast(message);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        style={{
          marginTop: 36,
          border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 18,
          background: dragging ? "var(--accent-soft)" : "transparent",
          padding: "56px 32px",
          textAlign: "center",
          cursor: busy ? "default" : "pointer",
          transition: "border-color .2s,background .2s",
        }}
      >
        {busy ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, maxWidth: 380, margin: "0 auto" }}>
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>
                {fileName}
                {total > 1 && (
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}> ({index} of {total})</span>
                )}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{progress}%</span>
            </div>
            <Equalizer bars={5} width={4} height={26} gap={4} />
            <div style={{ width: "100%", height: 7, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: 4,
                  background: "linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#fff))",
                  backgroundSize: "200% 100%",
                  animation: "plShimmer 1.3s linear infinite",
                  transition: "width .12s linear",
                }}
              />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
              {status === "finalizing" ? "Finalizing…" : `~${etaSeconds ?? 0}s remaining`}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cancel();
                showToast("Upload canceled");
              }}
              className="pl-btn-ghost"
              style={{ height: 34, padding: "0 16px", borderRadius: 9, fontSize: 12.5, color: "var(--text-2)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 15,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-2)",
              }}
            >
              <UploadIcon />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>Drag &amp; drop files here</div>
            <div style={{ fontSize: 14, color: "var(--text-2)" }}>
              or <span style={{ color: "var(--accent)", fontWeight: 700 }}>click to browse</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", letterSpacing: ".02em" }}>
              Up to {MAX_UPLOAD_FILES} files · 40 MB per file · 100 MB total
            </div>
            <div
              title={allowedExtensions.join(", ")}
              style={{ fontSize: 12, color: "var(--muted)", maxWidth: 360, lineHeight: 1.5 }}
            >
              {allowedTypesSummary}
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute}
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          // Reset so re-selecting the same file(s) fires change again.
          e.target.value = "";
        }}
      />
    </>
  );
}
