import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.js";

/**
 * Inverse of ProtectedRoute: keep already-signed-in users out of the login /
 * signup screens by bouncing them to the home page. Waits for the initial token
 * check so we don't flash the form before redirecting.
 */
export function RedirectIfAuthed() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
