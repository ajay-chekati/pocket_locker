import { Suspense, lazy, useState } from "react";
import type { FileDto } from "@pocket-locker/shared";
import { formatBytes, formatDate } from "../../lib/format.js";

// Office renderers (mammoth/SheetJS) are heavy and only needed once a preview
// opens, so the previewer is split into an on-demand chunk.
const FilePreview = lazy(() =>
  import("./FilePreview.js").then((m) => ({ default: m.FilePreview })),
);

/**
 * Renders a list of files; clicking a row opens an inline preview. Owns the
 * selected-file state so both the uploads browser and the home "recent" list
 * get preview for free. Presentation is intentionally bare (design pass later).
 */
export function FileList({ files }: { files: FileDto[] }) {
  const [selected, setSelected] = useState<FileDto | null>(null);

  if (files.length === 0) return null;

  return (
    <>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {files.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              onClick={() => setSelected(file)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                width: "100%",
                textAlign: "left",
                padding: "8px 4px",
                background: "none",
                border: "none",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {file.name}
              </span>
              <span style={{ color: "#666", whiteSpace: "nowrap" }}>
                {formatBytes(file.size)} · {formatDate(file.createdAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <Suspense fallback={null}>
          <FilePreview file={selected} onClose={() => setSelected(null)} />
        </Suspense>
      )}
    </>
  );
}
