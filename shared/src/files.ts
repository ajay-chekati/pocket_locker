import { z } from "zod";
import { MAX_FILE_SIZE_BYTES } from "./constants.js";
import { isAllowedMimeType, type PreviewKind } from "./fileTypes.js";
import { paginationQuerySchema } from "./pagination.js";

/** Request to begin an upload — the client declares the file's metadata. */
export const createUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, "File exceeds the 40 MB per-file limit"),
  mimeType: z
    .string()
    .refine(isAllowedMimeType, { message: "Unsupported file type" }),
});

export type CreateUploadRequest = z.infer<typeof createUploadSchema>;

/** Response with the signed URL the client PUTs the file to (direct to storage). */
export interface CreateUploadResponse {
  fileId: string;
  uploadUrl: string;
}

/** Public view of a stored file. */
export interface FileDto {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  previewKind: PreviewKind;
  createdAt: string;
}

/** Sort orders for the file list. Each maps to a stable (field, id) ordering. */
export const fileSortValues = [
  "recent",
  "oldest",
  "largest",
  "smallest",
] as const;
export type FileSort = (typeof fileSortValues)[number];

/** Query for `GET /files` — keyset pagination + sort + filename search. */
export const listFilesQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(fileSortValues).default("recent"),
  q: z.string().trim().min(1).max(255).optional(),
});

export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;

/** Response for `GET /files/:id/view-url` — a short-lived inline-preview URL. */
export interface ViewUrlResponse {
  url: string;
}

/** Response for `GET /files/usage` — bytes used against the plan quota. */
export interface UsageResponse {
  used: number;
  quota: number;
}
