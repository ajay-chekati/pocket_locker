import { useAuth } from "../features/auth/AuthContext.js";
import { AppShell } from "../components/AppShell.js";
import { UploadDropzone } from "../features/files/UploadDropzone.js";
import { RecentUploads } from "../features/files/RecentUploads.js";
import { LandingPage } from "./LandingPage.js";

/**
 * Index route. Logged-out visitors see the landing page; signed-in users see
 * the upload-focused home with their most recent uploads below.
 */
export function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LandingPage />;

  return (
    <AppShell>
      <section className="pl-pad pl-anim-up" style={{ maxWidth: 900, margin: "0 auto", padding: "64px 40px 40px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".16em", color: "var(--accent)", marginBottom: 14 }}>
          WELCOME BACK
        </div>
        <h1 style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 12px" }}>
          Drop a file to get started
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-2)", margin: 0, maxWidth: 460, lineHeight: 1.5 }}>
          Add files to your locker. We'll handle the rest — find them again anytime from any device.
        </p>

        <UploadDropzone />
        <RecentUploads />
      </section>
    </AppShell>
  );
}
