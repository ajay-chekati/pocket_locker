import { useEffect, useState } from "react";
import { fileSortValues, type FileSort } from "@pocket-locker/shared";
import { FileList } from "./FileList.js";
import { useFiles } from "./useFiles.js";

const SORT_LABELS: Record<FileSort, string> = {
  recent: "Recent",
  oldest: "Oldest",
  largest: "Largest",
  smallest: "Smallest",
};

/** Debounce a value so each keystroke doesn't fire a request. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/**
 * Full file-browsing experience: sort tabs, filename search, the file list, and
 * a "Load more" button driven by the keyset cursor.
 */
export function FileBrowser() {
  const [sort, setSort] = useState<FileSort>("recent");
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), 300);

  const {
    files,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFiles({ sort, q });

  return (
    <div>
      <div role="tablist" aria-label="Sort files" style={{ display: "flex", gap: 8 }}>
        {fileSortValues.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={sort === value}
            onClick={() => setSort(value)}
            style={{ fontWeight: sort === value ? 700 : 400 }}
          >
            {SORT_LABELS[value]}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by filename"
        aria-label="Search by filename"
        style={{ display: "block", margin: "12px 0", width: "100%", maxWidth: 360 }}
      />

      {isPending && <p>Loading files…</p>}
      {isError && <p role="alert">Couldn’t load your files.</p>}
      {!isPending && !isError && files.length === 0 && (
        <p>{q ? `No files match “${q}”.` : "No uploads yet."}</p>
      )}

      <FileList files={files} />

      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          style={{ marginTop: 12 }}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
