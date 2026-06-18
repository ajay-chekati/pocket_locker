import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.js";
import { LandingPage } from "./LandingPage.js";

/**
 * Index route. Logged-out visitors see the landing page; signed-in users see
 * the upload-focused home. (Upload UI + recent uploads arrive in PR 2/PR 3.)
 */
export function HomePage() {
  const { user } = useAuth();

  if (!user) return <LandingPage />;

  return (
    <section>
      <h1>Welcome back</h1>
      <p>Drop files here or pick from your device to upload. (Coming in PR 2.)</p>
      <p>
        <Link to="/uploads">View your uploads</Link>
      </p>
    </section>
  );
}
