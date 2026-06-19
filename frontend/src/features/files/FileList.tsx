import { useState } from "react";
import type { FileDto } from "@pocket-locker/shared";
import { extOf, formatBytes, formatDate, kindLabel } from "../../lib/format.js";
import { DownloadIcon } from "../../components/icons.js";
import { PreviewHost } from "./PreviewHost.js";
import { useDownload } from "./useDownload.js";

/**
 * The uploads list. Each row opens an inline preview; the trailing download
 * icon downloads without opening the preview. Owns the selected-file state.
 */
export function FileList({ files }: { files: FileDto[] }) {
  const [selected, setSelected] = useState<FileDto | null>(null);
  const download = useDownload();

  if (files.length === 0) return null;

  return (
    <>
      <div style={{ marginTop: 24, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg-elev)" }}>
        {files.map((file, i) => (
          <div
            key={file.id}
            onClick={() => setSelected(file)}
            className="pl-file-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "15px 20px",
              borderBottom: i === files.length - 1 ? "none" : "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <span style={{ flex: "none", padding: "5px 9px", borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 11, fontWeight: 700, letterSpacing: ".03em", minWidth: 46, textAlign: "center" }}>
              {extOf(file.name)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {file.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {kindLabel(file.previewKind)} · {formatDate(file.createdAt)}
              </div>
            </div>
            <span className="pl-hidem" style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap" }}>
              {formatBytes(file.size)}
            </span>
            <button
              type="button"
              title="Download"
              aria-label={`Download ${file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                void download(file);
              }}
              className="pl-row-action pl-bare"
              style={{ flex: "none", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, color: "var(--text-2)" }}
            >
              <DownloadIcon />
            </button>
          </div>
        ))}
      </div>

      <PreviewHost file={selected} onClose={() => setSelected(null)} />
    </>
  );
}
