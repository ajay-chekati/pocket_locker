/** Domain constants shared by frontend and backend. */

export const MB = 1024 * 1024;
export const GB = 1024 * MB;

/** Max size of a single uploaded file. */
export const MAX_FILE_SIZE_BYTES = 40 * MB;

/** Total storage quota per plan. */
export const PLAN_QUOTAS = {
  free: 100 * MB,
  pro: 50 * GB,
} as const;

export type Plan = keyof typeof PLAN_QUOTAS;

/** Default page size for paginated list endpoints. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
