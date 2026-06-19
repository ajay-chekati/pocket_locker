import { useAuth } from "../features/auth/AuthContext.js";
import { UploadDropzone } from "../features/files/UploadDropzone.js";
import { RecentUploads } from "../features/files/RecentUploads.js";
import { LandingPage } from "./LandingPage.js";

/**
 * Index route. Logged-out visitors see the landing page; signed-in users see
 * the upload-focused home with their most recent uploads below.
 */
export function HomePage() {
  const { user } = useAuth();

  if (!user) return <LandingPage />;

  return (
    <section>
      <h1>Welcome back</h1>
      <p>Drop a file here or pick one from your device to upload.</p>
      <UploadDropzone />
      <RecentUploads />
    </section>
  );
}
