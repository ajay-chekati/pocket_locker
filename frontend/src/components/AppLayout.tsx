import { Link, Outlet } from "react-router-dom";

/**
 * Bare app shell. Structure only — header on top (with a right-aligned slot
 * for logout/usage later) and a bottom nav. The design pass will restyle these
 * without changing the layout contract.
 */
export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/">Pocket Locker</Link>
        <div className="app-header-right">
          {/* usage indicator + logout mount here in later PRs */}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-bottom-nav">
        <Link to="/">Home</Link>
        <Link to="/uploads">Uploads</Link>
      </nav>
    </div>
  );
}
