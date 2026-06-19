import { AppShell } from "../components/AppShell.js";
import { FileBrowser } from "../features/files/FileBrowser.js";

export function UploadsPage() {
  return (
    <AppShell>
      <FileBrowser />
    </AppShell>
  );
}
