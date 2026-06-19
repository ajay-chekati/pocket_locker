/**
 * Single source of truth for which file types are allowed and how each one is
 * previewed. Drives the backend upload allowlist, the frontend `<input accept>`,
 * and the in-app viewer (PR 3).
 */

export type PreviewKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "office" // rendered client-side (mammoth/SheetJS) in PR 3
  | "none"; // not previewable → metadata card + download

interface FileTypeInfo {
  extensions: string[];
  preview: PreviewKind;
}

export const ALLOWED_FILE_TYPES: Record<string, FileTypeInfo> = {
  // Images
  "image/jpeg": { extensions: [".jpg", ".jpeg"], preview: "image" },
  "image/png": { extensions: [".png"], preview: "image" },
  "image/gif": { extensions: [".gif"], preview: "image" },
  "image/webp": { extensions: [".webp"], preview: "image" },
  // PDF
  "application/pdf": { extensions: [".pdf"], preview: "pdf" },
  // Word — .docx renders client-side; legacy .doc is download-only
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extensions: [".docx"],
    preview: "office",
  },
  "application/msword": { extensions: [".doc"], preview: "none" },
  // Excel — .xlsx renders client-side; legacy .xls is download-only
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    extensions: [".xlsx"],
    preview: "office",
  },
  "application/vnd.ms-excel": { extensions: [".xls"], preview: "none" },
  // PowerPoint — download-only
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    extensions: [".pptx"],
    preview: "none",
  },
  "application/vnd.ms-powerpoint": { extensions: [".ppt"], preview: "none" },
  // Text
  "text/plain": { extensions: [".txt"], preview: "text" },
  "text/markdown": { extensions: [".md"], preview: "text" },
  "text/csv": { extensions: [".csv"], preview: "text" },
  // Video
  "video/mp4": { extensions: [".mp4"], preview: "video" },
  "video/webm": { extensions: [".webm"], preview: "video" },
  "video/quicktime": { extensions: [".mov"], preview: "video" },
  // Audio
  "audio/mpeg": { extensions: [".mp3"], preview: "audio" },
  "audio/wav": { extensions: [".wav"], preview: "audio" },
  "audio/x-wav": { extensions: [".wav"], preview: "audio" },
  "audio/mp4": { extensions: [".m4a"], preview: "audio" },
  "audio/ogg": { extensions: [".ogg"], preview: "audio" },
  // Archive
  "application/zip": { extensions: [".zip"], preview: "none" },
};

export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_FILE_TYPES);

export const isAllowedMimeType = (mime: string): boolean =>
  Object.prototype.hasOwnProperty.call(ALLOWED_FILE_TYPES, mime);

export const previewKindFor = (mime: string): PreviewKind =>
  ALLOWED_FILE_TYPES[mime]?.preview ?? "none";

/** Value for an <input type="file" accept="..."> attribute. */
export const acceptAttribute = ALLOWED_MIME_TYPES.join(",");
