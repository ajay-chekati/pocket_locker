import type {
  CreateUploadRequest,
  CreateUploadResponse,
  FileDto,
  FileSort,
  Page,
  UsageResponse,
  ViewUrlResponse,
} from "@pocket-locker/shared";
import { api } from "../../lib/apiClient.js";

export interface ListFilesParams {
  sort: FileSort;
  q?: string;
  cursor?: string;
  limit?: number;
}

export const filesApi = {
  createUploadUrl: (body: CreateUploadRequest) =>
    api<CreateUploadResponse>("/files/upload-url", { method: "POST", body }),
  confirmUpload: (fileId: string) =>
    api<FileDto>(`/files/${fileId}/confirm`, { method: "POST" }),
  list: ({ sort, q, cursor, limit }: ListFilesParams) => {
    const qs = new URLSearchParams({ sort });
    if (q) qs.set("q", q);
    if (cursor) qs.set("cursor", cursor);
    if (limit) qs.set("limit", String(limit));
    return api<Page<FileDto>>(`/files?${qs.toString()}`);
  },
  getViewUrl: (fileId: string) =>
    api<ViewUrlResponse>(`/files/${fileId}/view-url`),
  getUsage: () => api<UsageResponse>("/files/usage"),
};

/**
 * PUT the file straight to Supabase Storage via the signed URL, reporting
 * progress. Bytes never pass through our backend, so we get real progress
 * events and avoid request-size limits.
 */
export function uploadToSignedUrl(
  url: string,
  file: File,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new DOMException("Upload canceled", "AbortError"));
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
    }
    xhr.send(file);
  });
}
