import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILES,
  isAllowedMimeType,
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
  /** 0–100 for the file currently uploading. */
  progress: number;
  /** Estimated seconds remaining for the current file (null until measurable). */
  etaSeconds: number | null;
  error: string | null;
  /** Name of the file currently uploading. */
  fileName: string | null;
  /** 1-based position of the current file within the batch. */
  index: number;
  /** Total files in the current batch. */
  total: number;
}

/** Outcome of an upload batch, used by the caller to surface a summary toast. */
export interface BatchResult {
  /** Names of files that uploaded successfully. */
  uploaded: string[];
  /** Human-readable "name: reason" messages for files that failed. */
  errors: string[];
  /** True when more than MAX_UPLOAD_FILES were dropped and the rest were ignored. */
  truncated: boolean;
}

const initial: UploadState = {
  status: "idle",
  progress: 0,
  etaSeconds: null,
  error: null,
  fileName: null,
  index: 0,
  total: 0,
};

/**
 * Drives uploads for a batch of up to MAX_UPLOAD_FILES files. Each file runs the
 * 3-step flow sequentially: reserve (get signed URL) → PUT to storage with
 * progress/ETA → confirm. Exposes `uploadMany(files)`, live per-file state and a
 * `cancel` that aborts the whole batch.
 */
export function useFileUpload() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>(initial);
  const startRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => setState(initial), []);

  /** Abort the in-flight batch and return to idle. */
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState(initial);
  }, []);

  const uploadMany = useCallback(
    async (files: File[]): Promise<BatchResult> => {
      const list = files.slice(0, MAX_UPLOAD_FILES);
      const truncated = files.length > MAX_UPLOAD_FILES;
      const uploaded: string[] = [];
      const errors: string[] = [];

      const controller = new AbortController();
      abortRef.current = controller;
      const total = list.length;

      for (let i = 0; i < list.length; i++) {
        if (controller.signal.aborted) break;
        const file = list[i];

        // Client-side pre-checks mirror the server's allowlist + per-file cap.
        if (!isAllowedMimeType(file.type)) {
          errors.push(`${file.name}: unsupported file type`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          errors.push(`${file.name}: exceeds the 40 MB limit`);
          continue;
        }

        setState({
          ...initial,
          status: "uploading",
          fileName: file.name,
          index: i + 1,
          total,
        });
        startRef.current = Date.now();

        try {
          const { fileId, uploadUrl } = await filesApi.createUploadUrl({
            name: file.name,
            size: file.size,
            mimeType: file.type,
          });

          await uploadToSignedUrl(
            uploadUrl,
            file,
            (loaded, totalBytes) => {
              const progress = Math.round((loaded / totalBytes) * 100);
              const elapsed = (Date.now() - startRef.current) / 1000;
              const speed = elapsed > 0 ? loaded / elapsed : 0; // bytes/sec
              const etaSeconds =
                speed > 0
                  ? Math.max(0, Math.round((totalBytes - loaded) / speed))
                  : null;
              setState((s) => ({ ...s, progress, etaSeconds }));
            },
            controller.signal,
          );

          setState((s) => ({ ...s, status: "finalizing", progress: 100, etaSeconds: 0 }));
          await filesApi.confirmUpload(fileId);
          uploaded.push(file.name);
        } catch (err) {
          // A user-initiated cancel aborts the whole batch — stop quietly.
          if (controller.signal.aborted) break;
          const message =
            err instanceof ApiRequestError ? err.error.message : "Upload failed";
          errors.push(`${file.name}: ${message}`);
        }
      }

      // Refresh file lists + storage usage (shared "files" key prefix).
      void queryClient.invalidateQueries({ queryKey: ["files"] });
      setState(initial);
      return { uploaded, errors, truncated };
    },
    [queryClient],
  );

  return { ...state, uploadMany, reset, cancel };
}
