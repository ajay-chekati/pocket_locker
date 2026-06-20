import { useState } from "react";
import type { FileDto } from "@pocket-locker/shared";
import { extOf, formatBytes, formatDate, kindLabel } from "../../lib/format.js";
import { DownloadIcon, TrashIcon } from "../../components/icons.js";
import { Modal } from "../../components/Modal.js";
import { useToast } from "../../components/ToastProvider.js";
import { PreviewHost } from "./PreviewHost.js";
import { useDownload } from "./useDownload.js";
import { useDeleteFile } from "./useFiles.js";

/**
 * The uploads list. Each row opens an inline preview; the trailing download
 * icon downloads and the trash icon asks to confirm before deleting (both
 * without opening the preview). Owns the selected + pending-delete state.
 */
export function FileList({ files }: { files: FileDto[] }) {
  const [selected, setSelected] = useState<FileDto | null>(null);
  const [toDelete, setToDelete] = useState<FileDto | null>(null);
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
            <button
              type="button"
              title="Delete"
              aria-label={`Delete ${file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(file);
              }}
              className="pl-row-action pl-row-danger pl-bare"
              style={{ flex: "none", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, color: "var(--text-2)" }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <PreviewHost file={selected} onClose={() => setSelected(null)} />
      {toDelete && (
        <ConfirmDeleteModal file={toDelete} onClose={() => setToDelete(null)} />
      )}
    </>
  );
}

/** Confirmation dialog for deleting a single file. */
function ConfirmDeleteModal({ file, onClose }: { file: FileDto; onClose: () => void }) {
  const { showToast } = useToast();
  const deleteFile = useDeleteFile();

  const confirm = async () => {
    try {
      await deleteFile.mutateAsync(file.id);
      showToast(`Deleted ${file.name}`);
      onClose();
    } catch {
      showToast(`Couldn't delete ${file.name}`);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={420} label={`Delete ${file.name}`}>
      <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 10px" }}>
        Delete file?
      </h3>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-2)", margin: "0 0 24px" }}>
        <strong style={{ color: "var(--text)" }}>{file.name}</strong> will be
        permanently removed from your locker. This can't be undone.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={deleteFile.isPending}
          className="pl-btn-danger"
          style={{ flex: 1, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 11, fontSize: 14.5 }}
        >
          <TrashIcon />
          {deleteFile.isPending ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={deleteFile.isPending}
          className="pl-btn-ghost"
          style={{ height: 46, padding: "0 22px", borderRadius: 11, fontSize: 14.5 }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
