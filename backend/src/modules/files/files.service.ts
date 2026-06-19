import type { File } from "@prisma/client";
import {
  MAX_FILE_SIZE_BYTES,
  PLAN_QUOTAS,
  previewKindFor,
  type CreateUploadRequest,
  type CreateUploadResponse,
  type FileDto,
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
