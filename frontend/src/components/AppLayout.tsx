import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.js";

/**
 * Bare app shell. Structure only — header on top with a right-aligned slot
 * (logout/usage), and a bottom nav. The design pass restyles these without
 * changing the layout contract.
 */
export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/">Pocket Locker</Link>
        <div className="app-header-right">
          {/* usage indicator mounts here in PR 5 */}
          {user ? (
            <>
              <span>{user.email}</span>
              <button type="button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {user && (
        <nav className="app-bottom-nav">
          <Link to="/">Home</Link>
          <Link to="/uploads">Uploads</Link>
        </nav>
      )}
    </div>
  );
}
