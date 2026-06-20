import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { FileSort } from "@pocket-locker/shared";
import { filesApi } from "./filesApi.js";

export interface FilesQuery {
  sort: FileSort;
  /** Filename search; empty string means no filter. */
  q?: string;
  /** Page size; defaults to the server default when omitted. */
  limit?: number;
}

/**
 * Keyset-paginated list of the user's files. The query key includes sort + q so
 * each filter combination caches independently; uploads invalidate `["files"]`
 * (a prefix), refreshing every variation. Returns a flat `files` array plus the
 * "load more" controls.
 */
export function useFiles({ sort, q = "", limit }: FilesQuery) {
  const query = useInfiniteQuery({
    queryKey: ["files", { sort, q }],
    queryFn: ({ pageParam }) =>
      filesApi.list({ sort, q: q || undefined, cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  return {
    ...query,
    files: query.data?.pages.flatMap((p) => p.items) ?? [],
  };
}

/**
 * Fetch a short-lived signed preview URL on demand. Disabled until `enabled`
 * (e.g. a preview opens) so we don't mint URLs for rows that are never viewed.
 */
export function useViewUrl(fileId: string, enabled = true) {
  return useQuery({
    queryKey: ["view-url", fileId],
    queryFn: () => filesApi.getViewUrl(fileId),
    enabled,
    // Signed URLs are short-lived; don't reuse a stale one across remounts.
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Current storage usage (bytes used + plan quota) for the header indicator and
 * storage modal. Shares the `["files"]` key prefix so uploads refresh it too.
 */
export function useUsage() {
  return useQuery({
    queryKey: ["files", "usage"],
    queryFn: () => filesApi.getUsage(),
  });
}

/**
 * Delete a file, then refresh the list + usage (shared `["files"]` prefix) so
 * the row disappears and reclaimed storage is reflected.
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => filesApi.remove(fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
