import { Link } from "react-router-dom";
import { FileList } from "./FileList.js";
import { useFiles } from "./useFiles.js";

/**
 * Compact "recent uploads" strip for the home page. Reuses the same list hook
 * and row/preview UI as the uploads browser, capped to the most recent few.
 */
export function RecentUploads() {
  const { files, isPending } = useFiles({ sort: "recent", limit: 5 });

  if (isPending) return null;
  if (files.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: "1rem" }}>Recent uploads</h2>
      <FileList files={files} />
      <p style={{ marginTop: 8 }}>
        <Link to="/uploads">View all uploads</Link>
      </p>
    </div>
  );
}
