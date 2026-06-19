import { useQuery } from "@tanstack/react-query";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { FileDto } from "@pocket-locker/shared";
import { Modal } from "../../components/Modal.js";
import { CloseIcon, DownloadIcon } from "../../components/icons.js";
import { Equalizer } from "../../components/Equalizer.js";
import { extOf, formatBytes, formatDate, kindLabel } from "../../lib/format.js";
import { useViewUrl } from "./useFiles.js";
import { useDownload } from "./useDownload.js";

/**
 * Inline previewer in the design's modal. Fetches a short-lived signed URL for
 * the file, then renders it by `previewKind`:
 *   image/pdf/video/audio  → native browser element pointed at the URL
 *   text                   → fetched and shown verbatim
 *   office (.docx/.xlsx)    → converted to HTML client-side (mammoth / SheetJS)
 *   none                   → metadata card
 */
/** Kinds that render into a large viewer worth filling the modal height. */
const FILLS_HEIGHT = new Set(["image", "pdf", "video", "text", "office"]);

export function FilePreview({ file, onClose }: { file: FileDto; onClose: () => void }) {
  const { data, isLoading, isError } = useViewUrl(file.id);
  const download = useDownload();
  const url = data?.url;
  const fills = FILLS_HEIGHT.has(file.previewKind);

  return (
    <Modal onClose={onClose} maxWidth={880} padding={24} fitHeight={fills} label={`Preview of ${file.name}`}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <span style={{ flex: "none", padding: "5px 10px", borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 11, fontWeight: 700 }}>
          {extOf(file.name)}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {file.name}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="pl-modal-close" style={closeBtnStyle}>
          <CloseIcon />
        </button>
      </div>

      <div style={{ flex: fills ? "1 1 auto" : "none", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {isLoading && <Centered>Loading preview…</Centered>}
        {isError && <Centered alert>Couldn't load this file.</Centered>}
        {url && <PreviewBody file={file} url={url} />}
      </div>

      <div style={{ flex: "none", display: "flex", gap: 10, marginTop: 20 }}>
        <button
          type="button"
          onClick={() => void download(file)}
          className="pl-btn-primary"
          style={{ flex: 1, height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 11, fontSize: 14.5 }}
        >
          <DownloadIcon />
          Download
        </button>
        <button type="button" onClick={onClose} className="pl-btn-ghost" style={{ height: 48, padding: "0 22px", borderRadius: 11, fontSize: 14.5 }}>
          Close
        </button>
      </div>
    </Modal>
  );
}

const closeBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  flex: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 9,
  background: "var(--surface)",
  color: "var(--text-2)",
  cursor: "pointer",
};

const frameStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  overflow: "hidden",
  background: "var(--surface)",
};

/** Fill the modal's flexible middle region (used by the large viewers). */
const fillStyle: React.CSSProperties = { flex: "1 1 auto", minHeight: 0 };

function PreviewBody({ file, url }: { file: FileDto; url: string }) {
  switch (file.previewKind) {
    case "image":
      return (
        <div style={{ ...frameStyle, ...fillStyle, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <img src={url} alt={file.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
        </div>
      );
    case "pdf":
      return <iframe src={url} title={file.name} style={{ ...frameStyle, ...fillStyle, width: "100%", background: "#fff" }} />;
    case "video":
      return (
        <div style={{ ...frameStyle, ...fillStyle, background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <video src={url} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
      );
    case "audio":
      return (
        <div style={{ ...frameStyle, padding: 24, background: "var(--bg-elev)" }}>
          <audio src={url} controls style={{ width: "100%" }} />
        </div>
      );
    case "text":
      return <TextPreview url={url} />;
    case "office":
      return <OfficePreview url={url} mimeType={file.mimeType} />;
    default:
      return <MetadataFallback file={file} />;
  }
}

function Centered({ children, alert }: { children: React.ReactNode; alert?: boolean }) {
  return (
    <div role={alert ? "alert" : undefined} style={{ ...frameStyle, ...fillStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 48, color: alert ? "var(--accent)" : "var(--text-2)", fontSize: 14 }}>
      {!alert && <Equalizer bars={3} width={3} height={14} gap={3} duration={0.9} />}
      {children}
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["preview-text", url],
    queryFn: () => fetch(url).then((r) => r.text()),
    staleTime: 0,
    gcTime: 0,
  });
  if (isLoading) return <Centered>Loading…</Centered>;
  if (isError) return <Centered alert>Couldn't read this file.</Centered>;
  return (
    <pre
      style={{
        ...frameStyle,
        ...fillStyle,
        background: "var(--bg-elev)",
        padding: 24,
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "auto",
        fontSize: 13,
        lineHeight: 1.6,
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

  if (isLoading) return <Centered>Rendering document…</Centered>;
  if (isError) return <Centered alert>Couldn't render this document.</Centered>;
  return (
    <div
      style={{ ...frameStyle, ...fillStyle, background: "#fff", color: "#0a0a0b", padding: 24, overflow: "auto" }}
      // Content is derived from the user's own uploaded file.
      dangerouslySetInnerHTML={{ __html: data ?? "" }}
    />
  );
}

function MetadataFallback({ file }: { file: FileDto }) {
  const rows: Array<[string, string]> = [
    ["Name", file.name],
    ["Type", kindLabel(file.previewKind)],
    ["Size", formatBytes(file.size)],
    ["Uploaded", formatDate(file.createdAt)],
  ];
  return (
    <>
      <div style={{ ...frameStyle }}>
        {rows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              padding: "14px 18px",
              borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 14, textAlign: "center" }}>
        No inline preview available for this file type.
      </div>
    </>
  );
}
