/** Human-readable byte size, e.g. 1536 → "1.5 KB", 0 → "0 B". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Short, locale-friendly date for file rows. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Uppercase file extension for the badge, e.g. "report.PDF" → "PDF". */
export function extOf(name: string): string {
  const ext = name.split(".").pop();
  return ext && ext !== name ? ext.toUpperCase() : "FILE";
}

const KIND_LABELS: Record<string, string> = {
  image: "Image",
  pdf: "Document",
  office: "Document",
  video: "Video",
  audio: "Audio",
  text: "Text file",
  none: "File",
};

/** Friendly label for a file's preview kind, shown under the filename. */
export function kindLabel(previewKind: string): string {
  return KIND_LABELS[previewKind] ?? "File";
}
