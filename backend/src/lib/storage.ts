import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Supabase Storage wrapper. Uploads go directly browser → Supabase via a signed
 * URL, so the backend never proxies file bytes — it only issues URLs and reads
 * object metadata to verify what was actually uploaded.
 */
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const bucket = () => supabase.storage.from(env.SUPABASE_BUCKET);

/** Create a one-time signed URL the client PUTs the file to. */
export async function createSignedUploadUrl(path: string): Promise<string> {
  const { data, error } = await bucket().createSignedUploadUrl(path);
  if (error || !data) {
    logger.error({ err: error, path }, "createSignedUploadUrl failed");
    throw error ?? new Error("Failed to create signed upload URL");
  }
  return data.signedUrl;
}

/**
 * Return the real byte size of an uploaded object, or null if it doesn't exist.
 * Used at confirm-time to validate the client's declared size.
 */
export async function getObjectSize(path: string): Promise<number | null> {
  const slash = path.lastIndexOf("/");
  const folder = slash === -1 ? "" : path.slice(0, slash);
  const name = slash === -1 ? path : path.slice(slash + 1);

  const { data, error } = await bucket().list(folder, { search: name });
  if (error) {
    logger.error({ err: error, path }, "storage list failed");
    throw error;
  }
  const match = data?.find((o) => o.name === name);
  const size = match?.metadata?.size;
  return typeof size === "number" ? size : null;
}

/**
 * Create a short-lived signed URL for reading an object inline (preview/view).
 * Bytes are served straight from Supabase, so the backend never proxies them.
 */
export async function createSignedViewUrl(
  path: string,
  expiresIn: number,
): Promise<string> {
  const { data, error } = await bucket().createSignedUrl(path, expiresIn);
  if (error || !data) {
    logger.error({ err: error, path }, "createSignedViewUrl failed");
    throw error ?? new Error("Failed to create signed view URL");
  }
  return data.signedUrl;
}

/** Remove an object (used to roll back failed/oversized uploads). */
export async function removeObject(path: string): Promise<void> {
  const { error } = await bucket().remove([path]);
  if (error) logger.error({ err: error, path }, "storage remove failed");
}
