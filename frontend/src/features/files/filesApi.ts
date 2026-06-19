import type {
  CreateUploadRequest,
  CreateUploadResponse,
  FileDto,
} from "@pocket-locker/shared";
import { api } from "../../lib/apiClient.js";

export const filesApi = {
  createUploadUrl: (body: CreateUploadRequest) =>
    api<CreateUploadResponse>("/files/upload-url", { method: "POST", body }),
  confirmUpload: (fileId: string) =>
    api<FileDto>(`/files/${fileId}/confirm`, { method: "POST" }),
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
    xhr.send(file);
  });
}
