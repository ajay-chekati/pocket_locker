import type { File, Prisma } from "@prisma/client";
import {
  MAX_FILE_SIZE_BYTES,
  PLAN_QUOTAS,
  SIGNED_URL_TTL_SECONDS,
  previewKindFor,
  type CreateUploadRequest,
  type CreateUploadResponse,
  type FileDto,
  type ListFilesQuery,
  type Page,
  type ViewUrlResponse,
} from "@pocket-locker/shared";
import { prisma } from "../../lib/prisma.js";
import {
  badRequest,
  notFound,
  payloadTooLarge,
  quotaExceeded,
} from "../../lib/errors.js";
import {
  createSignedUploadUrl,
  createSignedViewUrl,
  getObjectSize,
  removeObject,
} from "../../lib/storage.js";

const toFileDto = (file: File): FileDto => ({
  id: file.id,
  name: file.name,
  size: file.size,
  mimeType: file.mimeType,
  previewKind: previewKindFor(file.mimeType),
  createdAt: file.createdAt.toISOString(),
});

const storagePathFor = (userId: string, fileId: string) =>
  `${userId}/${fileId}`;

/** Total bytes counted against quota — only finalized (ready) files. */
export async function getUsedBytes(userId: string): Promise<number> {
  const agg = await prisma.file.aggregate({
    _sum: { size: true },
    where: { userId, status: "ready" },
  });
  return agg._sum.size ?? 0;
}

async function quotaFor(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User not found");
  return PLAN_QUOTAS[user.plan];
}

/**
 * Reserve an upload: validate quota against the declared size, create a pending
 * File row, and hand back a signed URL the client uploads to directly.
 */
export async function createUpload(
  userId: string,
  input: CreateUploadRequest,
): Promise<CreateUploadResponse> {
  const [used, quota] = await Promise.all([
    getUsedBytes(userId),
    quotaFor(userId),
  ]);
  if (used + input.size > quota) {
    throw quotaExceeded("Not enough storage left for this file", {
      used,
      quota,
      fileSize: input.size,
    });
  }

  const file = await prisma.file.create({
    data: {
      userId,
      name: input.name,
      mimeType: input.mimeType,
      size: input.size, // declared; re-verified on confirm
      storagePath: "", // set below once we know the id
      status: "pending",
    },
  });

  const storagePath = storagePathFor(userId, file.id);
  await prisma.file.update({
    where: { id: file.id },
    data: { storagePath },
  });

  const uploadUrl = await createSignedUploadUrl(storagePath);
  return { fileId: file.id, uploadUrl };
}

/**
 * Finalize an upload: read the real object size from storage and reject (rolling
 * back the object + row) if it's missing, over the per-file cap, or over quota.
 */
export async function confirmUpload(
  userId: string,
  fileId: string,
): Promise<FileDto> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId, status: "pending" },
  });
  if (!file) throw notFound("Upload not found");

  const rollback = async () => {
    await removeObject(file.storagePath);
    await prisma.file.delete({ where: { id: file.id } });
  };

  const realSize = await getObjectSize(file.storagePath);
  if (realSize === null) {
    await prisma.file.delete({ where: { id: file.id } });
    throw badRequest("No uploaded file found to confirm");
  }

  if (realSize > MAX_FILE_SIZE_BYTES) {
    await rollback();
    throw payloadTooLarge("File exceeds the 40 MB per-file limit");
  }

  const [used, quota] = await Promise.all([
    getUsedBytes(userId),
    quotaFor(userId),
  ]);
  if (used + realSize > quota) {
    await rollback();
    throw quotaExceeded("Not enough storage left for this file", {
      used,
      quota,
      fileSize: realSize,
    });
  }

  const ready = await prisma.file.update({
    where: { id: file.id },
    data: { size: realSize, status: "ready" },
  });
  return toFileDto(ready);
}

/**
 * Which column each sort orders by and in which direction. The `id` is always
 * appended as a stable tiebreaker so keyset pagination is deterministic when
 * two rows share a createdAt/size. Each pairing matches a composite index on
 * `File` (see schema.prisma).
 */
const SORT_CONFIG = {
  recent: { field: "createdAt", dir: "desc" },
  oldest: { field: "createdAt", dir: "asc" },
  largest: { field: "size", dir: "desc" },
  smallest: { field: "size", dir: "asc" },
} as const;

type CursorValue = { v: string | number; id: string };

/** Opaque cursor = base64url of the last row's sort value + id. */
function encodeCursor(file: File, field: "createdAt" | "size"): string {
  const value: CursorValue = {
    v: field === "createdAt" ? file.createdAt.toISOString() : file.size,
    id: file.id,
  };
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeCursor(cursor: string): CursorValue {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString(),
    ) as CursorValue;
    if (
      (typeof parsed.v !== "string" && typeof parsed.v !== "number") ||
      typeof parsed.id !== "string"
    ) {
      throw new Error("malformed cursor");
    }
    return parsed;
  } catch {
    throw badRequest("Invalid cursor");
  }
}

/**
 * List a user's ready files with keyset pagination, sorting and an optional
 * case-insensitive filename search. Fetches one extra row to decide whether a
 * next page exists without a separate count query.
 */
export async function listFiles(
  userId: string,
  { cursor, limit, sort, q }: ListFilesQuery,
): Promise<Page<FileDto>> {
  const { field, dir } = SORT_CONFIG[sort];

  const base: Prisma.FileWhereInput = { userId, status: "ready" };
  if (q) base.name = { contains: q, mode: "insensitive" };

  let where: Prisma.FileWhereInput = base;
  if (cursor) {
    const { v, id } = decodeCursor(cursor);
    const value = field === "createdAt" ? new Date(v as string) : (v as number);
    const cmp = dir === "desc" ? "lt" : "gt";
    // Rows strictly past the cursor in sort order: either the sort value is
    // beyond the cursor's, or it ties and the id breaks the tie.
    where = {
      AND: [
        base,
        {
          OR: [
            { [field]: { [cmp]: value } },
            { [field]: value, id: { [cmp]: id } },
          ],
        },
      ],
    };
  }

  const rows = await prisma.file.findMany({
    where,
    orderBy: [{ [field]: dir }, { id: dir }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1], field)
      : null;

  return { items: items.map(toFileDto), nextCursor };
}

/** Issue a short-lived signed URL for inline preview of a ready file. */
export async function getViewUrl(
  userId: string,
  fileId: string,
): Promise<ViewUrlResponse> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId, status: "ready" },
  });
  if (!file) throw notFound("File not found");

  const url = await createSignedViewUrl(
    file.storagePath,
    SIGNED_URL_TTL_SECONDS,
  );
  return { url };
}
