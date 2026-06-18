import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants.js";

/** A generic keyset-paginated response envelope. */
export interface Page<T> {
  items: T[];
  /** Opaque cursor to pass back for the next page; null when there are no more. */
  nextCursor: string | null;
}

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
