import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MAX_FILE_SIZE_BYTES,
  isAllowedMimeType,
  type FileDto,
} from "@pocket-locker/shared";
import { ApiRequestError } from "../../lib/apiClient.js";
import { filesApi, uploadToSignedUrl } from "./filesApi.js";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "finalizing"
  | "success"
  | "error";

export interface UploadState {
  status: UploadStatus;
  /** 0–100 */
  progress: number;
  /** Estimated seconds remaining (null until measurable). */
  etaSeconds: number | null;
  error: string | null;
  fileName: string | null;
}

const initial: UploadState = {
  status: "idle",
  progress: 0,
  etaSeconds: null,
  error: null,
  fileName: null,
};

/**
 * Drives the 3-step upload: reserve (get signed URL) → PUT to storage with
 * progress/ETA → confirm. Exposes a single `upload(file)` and live state.
 */
export function useFileUpload() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>(initial);
  const startRef = useRef(0);

  const reset = useCallback(() => setState(initial), []);

  const upload = useCallback(
    async (file: File): Promise<FileDto | null> => {
      // Client-side pre-checks mirror the server's allowlist + per-file cap.
      if (!isAllowedMimeType(file.type)) {
        setState({ ...initial, status: "error", fileName: file.name, error: "Unsupported file type" });
        return null;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setState({ ...initial, status: "error", fileName: file.name, error: "File exceeds the 40 MB limit" });
        return null;
      }

      setState({ ...initial, status: "uploading", fileName: file.name });
      startRef.current = Date.now();

      try {
        const { fileId, uploadUrl } = await filesApi.createUploadUrl({
          name: file.name,
          size: file.size,
          mimeType: file.type,
        });

        await uploadToSignedUrl(uploadUrl, file, (loaded, total) => {
          const progress = Math.round((loaded / total) * 100);
          const elapsed = (Date.now() - startRef.current) / 1000;
          const speed = elapsed > 0 ? loaded / elapsed : 0; // bytes/sec
          const etaSeconds =
            speed > 0 ? Math.max(0, Math.round((total - loaded) / speed)) : null;
          setState((s) => ({ ...s, progress, etaSeconds }));
        });

        setState((s) => ({ ...s, status: "finalizing", progress: 100, etaSeconds: 0 }));
        const dto = await filesApi.confirmUpload(fileId);

        setState((s) => ({ ...s, status: "success" }));
        // Refresh any file lists once they exist (PR 3).
        void queryClient.invalidateQueries({ queryKey: ["files"] });
        return dto;
      } catch (err) {
        const message =
          err instanceof ApiRequestError ? err.error.message : "Upload failed";
        setState((s) => ({ ...s, status: "error", error: message }));
        return null;
      }
    },
    [queryClient],
  );

  return { ...state, upload, reset };
}
