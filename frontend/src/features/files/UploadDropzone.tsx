import { useRef, useState, type DragEvent } from "react";
import { acceptAttribute } from "@pocket-locker/shared";
import { useFileUpload } from "./useFileUpload.js";

/** Format seconds as a short "about Xs / Xm" estimate. */
function formatEta(seconds: number | null): string {
  if (seconds === null) return "";
  if (seconds < 60) return `~${seconds}s remaining`;
  return `~${Math.ceil(seconds / 60)}m remaining`;
}

/**
 * Basic upload UI: drag-and-drop or click to pick. Styling is intentionally
 * minimal — the design pass restyles it later.
 */
export function UploadDropzone() {
  const { status, progress, etaSeconds, error, fileName, upload, reset } =
    useFileUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const busy = status === "uploading" || status === "finalizing";

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void upload(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!busy) handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a file"
        style={{
          border: "2px dashed #bbb",
          borderColor: dragging ? "#333" : "#bbb",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          cursor: busy ? "default" : "pointer",
        }}
      >
        <p>
          {busy
            ? "Uploading…"
            : "Drop a file here, or click to choose one (max 40 MB)"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttribute}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {busy && (
        <div aria-live="polite">
          <progress value={progress} max={100} />
          <span>
            {" "}
            {progress}% {status === "finalizing" ? "· finalizing" : formatEta(etaSeconds)}
          </span>
        </div>
      )}

      {status === "success" && (
        <p role="status">
          Uploaded <strong>{fileName}</strong>.{" "}
          <button type="button" onClick={reset}>
            Upload another
          </button>
        </p>
      )}

      {status === "error" && (
        <p role="alert">
          {fileName ? `${fileName}: ` : ""}
          {error}{" "}
          <button type="button" onClick={reset}>
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
