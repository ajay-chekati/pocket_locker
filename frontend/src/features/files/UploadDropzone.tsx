import { useEffect, useRef, useState, type DragEvent } from "react";
import { acceptAttribute } from "@pocket-locker/shared";
import { Equalizer } from "../../components/Equalizer.js";
import { UploadIcon } from "../../components/icons.js";
import { useToast } from "../../components/ToastProvider.js";
import { useFileUpload } from "./useFileUpload.js";

/**
 * Home-page upload target. Idle: a dashed drop zone (drag/drop or click to
 * browse). Active: filename, percent, the equalizer + shimmer bar and a cancel
 * button. Success/error are surfaced as toasts, returning the zone to idle.
 */
export function UploadDropzone() {
  const { status, progress, etaSeconds, error, fileName, upload, reset, cancel } =
    useFileUpload();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const busy = status === "uploading" || status === "finalizing";

  // Report terminal states as toasts, then drop back to the idle zone.
  useEffect(() => {
    if (status === "success") {
      showToast(`Uploaded ${fileName}`);
      reset();
    } else if (status === "error") {
      showToast(error ?? "Upload failed");
      reset();
    }
  }, [status, error, fileName, showToast, reset]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && !busy) void upload(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
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
        aria-label="Upload a file"
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
              Up to 40 MB per file · 100 MB total
            </div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={acceptAttribute} hidden onChange={(e) => handleFiles(e.target.files)} />
    </>
  );
}
