import { useCallback } from "react";
import type { FileDto } from "@pocket-locker/shared";
import { useToast } from "../../components/ToastProvider.js";
import { filesApi } from "./filesApi.js";

/**
 * Returns a `download(file)` that mints a short-lived signed URL, fetches the
 * bytes and saves them under the original filename (the signed URL is set up for
 * inline viewing, so we go via a blob to force a download). Progress + result
 * are surfaced as toasts.
 */
export function useDownload() {
  const { showToast } = useToast();

  return useCallback(
    async (file: FileDto) => {
      showToast(`Preparing ${file.name}…`);
      try {
        const { url } = await filesApi.getViewUrl(file.id);
        const blob = await fetch(url).then((r) => r.blob());
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        showToast(`Downloaded ${file.name}`);
      } catch {
        showToast(`Couldn't download ${file.name}`);
      }
    },
    [showToast],
  );
}
