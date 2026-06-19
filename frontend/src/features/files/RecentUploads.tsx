import { useState } from "react";
import { Link } from "react-router-dom";
import type { FileDto } from "@pocket-locker/shared";
import { extOf, formatBytes, formatDate } from "../../lib/format.js";
import { PreviewHost } from "./PreviewHost.js";
import { useFiles } from "./useFiles.js";

/** The home page's "Recent uploads" grid of file cards. */
export function RecentUploads() {
  const { files, isPending } = useFiles({ sort: "recent", limit: 4 });
  const [selected, setSelected] = useState<FileDto | null>(null);

  if (isPending || files.length === 0) return null;

  return (
    <div style={{ marginTop: 64 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>Recent uploads</h2>
        <Link to="/uploads" className="pl-bare" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
          View all →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 }}>
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => setSelected(file)}
            className="pl-file-card"
            style={{
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 18,
              border: "1px solid var(--border)",
              borderRadius: 14,
              background: "var(--bg-elev)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <span style={{ alignSelf: "flex-start", padding: "4px 9px", borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 11, fontWeight: 700, letterSpacing: ".03em" }}>
              {extOf(file.name)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {file.name}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {formatBytes(file.size)} · {formatDate(file.createdAt)}
            </span>
          </button>
        ))}
      </div>

      <PreviewHost file={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
