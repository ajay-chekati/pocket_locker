import { useEffect, useState } from "react";
import { fileSortValues, type FileSort } from "@pocket-locker/shared";
import { Equalizer } from "../../components/Equalizer.js";
import { SearchIcon } from "../../components/icons.js";
import { formatBytes } from "../../lib/format.js";
import { FileList } from "./FileList.js";
import { useFiles, useUsage } from "./useFiles.js";

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

/** Title, search + sort toolbar, the file list and a keyset "Load more". */
export function FileBrowser() {
  const [sort, setSort] = useState<FileSort>("recent");
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), 300);

  const { files, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFiles({ sort, q });
  const { data: usage } = useUsage();

  const empty = !isPending && !isError && files.length === 0;

  return (
    <section className="pl-pad pl-anim-up" style={{ maxWidth: 900, margin: "0 auto", padding: "48px 40px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 6px" }}>Your files</h1>
          <div style={{ fontSize: 13.5, color: "var(--text-2)" }}>
            {files.length}
            {hasNextPage ? "+" : ""} files · {formatBytes(usage?.used ?? 0)} used
          </div>
        </div>
      </div>

      <div className="pl-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files by name"
            aria-label="Search files by name"
            className="pl-input"
            style={{ width: "100%", height: 46, padding: "0 16px 0 42px", borderRadius: 11, fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {fileSortValues.map((value) => {
            const active = sort === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(value)}
                style={{
                  height: 42,
                  padding: "0 16px",
                  border: `1px solid ${active ? "var(--text)" : "var(--border)"}`,
                  borderRadius: 10,
                  background: active ? "var(--text)" : "transparent",
                  color: active ? "var(--bg)" : "var(--text-2)",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "Manrope,sans-serif",
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                {SORT_LABELS[value]}
              </button>
            );
          })}
        </div>
      </div>

      {isError && (
        <div style={{ marginTop: 48, textAlign: "center", color: "var(--accent)", fontSize: 15 }}>
          Couldn't load your files.
        </div>
      )}
      {empty && (
        <div style={{ marginTop: 48, textAlign: "center", color: "var(--muted)", fontSize: 15 }}>
          {q ? `No files match "${q}".` : "No uploads yet."}
        </div>
      )}

      <FileList files={files} />

      {hasNextPage && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="pl-btn-ghost"
            style={{ height: 46, minWidth: 150, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 11, fontSize: 14 }}
          >
            {isFetchingNextPage ? (
              <>
                <Equalizer bars={3} width={3} height={14} gap={3} duration={0.9} />
                <span style={{ color: "var(--text-2)" }}>Loading…</span>
              </>
            ) : (
              <span>Load more</span>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
