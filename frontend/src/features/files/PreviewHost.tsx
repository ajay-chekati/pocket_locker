import { Suspense, lazy } from "react";
import type { FileDto } from "@pocket-locker/shared";

// Office renderers (mammoth/SheetJS) are heavy and only needed once a preview
// opens, so the previewer stays in an on-demand chunk. Both the home grid and
// the uploads list mount the preview through here to share that split.
const FilePreview = lazy(() =>
  import("./FilePreview.js").then((m) => ({ default: m.FilePreview })),
);

export function PreviewHost({ file, onClose }: { file: FileDto | null; onClose: () => void }) {
  if (!file) return null;
  return (
    <Suspense fallback={null}>
      <FilePreview file={file} onClose={onClose} />
    </Suspense>
  );
}
