import { useQuery } from "@tanstack/react-query";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { FileDto } from "@pocket-locker/shared";
import { formatBytes, formatDate } from "../../lib/format.js";
import { useViewUrl } from "./useFiles.js";

/**
 * Inline previewer. Fetches a short-lived signed URL for the file, then renders
 * it according to `previewKind`:
 *   image/pdf/video/audio  → native browser element pointed at the URL
 *   text                   → fetched and shown verbatim
 *   office (.docx/.xlsx)    → converted to HTML client-side (mammoth / SheetJS)
 *   none                   → metadata card + open-in-new-tab fallback
 * Rendered inside a simple modal overlay; the design pass restyles it later.
 */
export function FilePreview({
  file,
  onClose,
}: {
  file: FileDto;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useViewUrl(file.id);
  const url = data?.url;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${file.name}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 8,
          maxWidth: 900,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 16,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <strong>{file.name}</strong>
          <button type="button" onClick={onClose} aria-label="Close preview">
            ✕
          </button>
        </header>

        <div style={{ marginTop: 12 }}>
          {isLoading && <p>Loading preview…</p>}
          {isError && <p role="alert">Couldn’t load this file.</p>}
          {url && <PreviewBody file={file} url={url} />}
        </div>
      </div>
    </div>
  );
}

function PreviewBody({ file, url }: { file: FileDto; url: string }) {
  switch (file.previewKind) {
    case "image":
      return (
        <img
          src={url}
          alt={file.name}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      );
    case "pdf":
      return (
        <iframe
          src={url}
          title={file.name}
          style={{ width: "100%", height: "75vh", border: 0 }}
        />
      );
    case "video":
      return <video src={url} controls style={{ maxWidth: "100%" }} />;
    case "audio":
      return <audio src={url} controls style={{ width: "100%" }} />;
    case "text":
      return <TextPreview url={url} />;
    case "office":
      return <OfficePreview url={url} mimeType={file.mimeType} />;
    default:
      return <MetadataFallback file={file} url={url} />;
  }
}

function TextPreview({ url }: { url: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["preview-text", url],
    queryFn: () => fetch(url).then((r) => r.text()),
    staleTime: 0,
    gcTime: 0,
  });
  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p role="alert">Couldn’t read this file.</p>;
  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: "75vh",
        overflow: "auto",
      }}
    >
      {data}
    </pre>
  );
}

function OfficePreview({ url, mimeType }: { url: string; mimeType: string }) {
  const isSpreadsheet = mimeType.includes("spreadsheet");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["preview-office", url],
    queryFn: async () => {
      const buffer = await fetch(url).then((r) => r.arrayBuffer());
      if (isSpreadsheet) {
        const wb = XLSX.read(buffer);
        return XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]]);
      }
      const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
      return value;
    },
    staleTime: 0,
    gcTime: 0,
  });

  if (isLoading) return <p>Rendering document…</p>;
  if (isError) return <p role="alert">Couldn’t render this document.</p>;
  return (
    <div
      style={{ maxHeight: "75vh", overflow: "auto" }}
      // Content is derived from the user's own uploaded file.
      dangerouslySetInnerHTML={{ __html: data ?? "" }}
    />
  );
}

function MetadataFallback({ file, url }: { file: FileDto; url: string }) {
  return (
    <div>
      <p>This file type can’t be previewed in the browser.</p>
      <dl>
        <dt>Type</dt>
        <dd>{file.mimeType}</dd>
        <dt>Size</dt>
        <dd>{formatBytes(file.size)}</dd>
        <dt>Uploaded</dt>
        <dd>{formatDate(file.createdAt)}</dd>
      </dl>
      <a href={url} target="_blank" rel="noreferrer">
        Open file in a new tab
      </a>
    </div>
  );
}
