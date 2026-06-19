import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.js";
import { useUsage } from "../features/files/useFiles.js";
import { StorageModal } from "../features/files/StorageModal.js";
import { DesignTokensModal } from "./DesignTokensModal.js";
import { Brand, BRAND } from "./Brand.js";
import { useTheme } from "../theme/ThemeProvider.js";
import { formatBytes } from "../lib/format.js";
import { AccountIcon, HomeIcon, LogoutIcon, MoonIcon, UploadIcon } from "./icons.js";

type Modal = "storage" | "tokens" | null;

/**
 * Signed-in app chrome: top header (brand, centered nav, storage + theme +
 * logout), a desktop footer, and a mobile bottom nav. Wraps the home, uploads
 * and pro page bodies. Storage/logout only appear when a user is present so the
 * shell can also host the public Pro page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [modal, setModal] = useState<Modal>(null);

  const navColor = (active: boolean) => (active ? "var(--text)" : "var(--muted)");
  const isHome = pathname === "/";
  const isUploads = pathname === "/uploads";
  const isPro = pathname === "/pro";

  return (
    <div className="pl-root pl-appwrap" style={{ display: "flex", flexDirection: "column" }}>
      <header
        className="pl-pad"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          height: 68,
          padding: "0 40px",
          background: "color-mix(in srgb,var(--bg) 84%,transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Brand />

        <nav className="pl-navlinks" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", gap: 30 }}>
          <NavLink label="Home" to="/" color={navColor(isHome)} />
          <NavLink label="Uploads" to="/uploads" color={navColor(isUploads)} />
          <NavLink label="Pro" to="/pro" color={navColor(isPro)} />
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <StorageButton onClick={() => setModal("storage")} />
              <button
                type="button"
                onClick={toggle}
                aria-label="Toggle theme"
                className="pl-icon-btn pl-hidem"
                style={{ width: 38, height: 38, flex: "none" }}
              >
                <MoonIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="pl-btn-ghost pl-logout"
                style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: 10, fontSize: 13 }}
              >
                <LogoutIcon />
                <span className="pl-logout-label">Log out</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={toggle} aria-label="Toggle theme" className="pl-icon-btn" style={{ width: 38, height: 38 }}>
                <MoonIcon />
              </button>
              <Link to="/login" className="pl-btn-ghost" style={{ height: 38, padding: "0 16px", borderRadius: 10, fontSize: 13.5, display: "flex", alignItems: "center", textDecoration: "none" }}>
                Log in
              </Link>
              <Link to="/signup" className="pl-btn-primary" style={{ height: 38, padding: "0 16px", borderRadius: 10, fontSize: 13.5, display: "flex", alignItems: "center", textDecoration: "none" }}>
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        className="pl-pad pl-hidem"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "22px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: "var(--muted)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--accent)" }} />
          <span style={{ fontWeight: 700, letterSpacing: ".16em", color: "var(--text-2)" }}>{BRAND}</span>
          <span style={{ marginLeft: 4 }}>© 2026</span>
        </div>
        <button type="button" onClick={() => setModal("tokens")} className="pl-link-muted" style={{ fontWeight: 600, fontSize: 12.5 }}>
          Design system
        </button>
      </footer>

      {/* Mobile bottom nav. */}
      <nav
        className="pl-bn"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          height: 68,
          background: "color-mix(in srgb,var(--bg) 92%,transparent)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid var(--border)",
          alignItems: "stretch",
          justifyContent: "space-around",
          padding: "0 8px",
        }}
      >
        <BottomItem label="Home" color={navColor(isHome)} onClick={() => navigate("/")} icon={<HomeIcon />} />
        <BottomItem label="Uploads" color={navColor(isUploads)} onClick={() => navigate("/uploads")} icon={<UploadIcon width={22} height={22} />} />
        <BottomItem label="Theme" color="var(--text-2)" onClick={toggle} icon={<MoonIcon width={22} height={22} />} />
        {user && (
          <BottomItem label="Account" color="var(--text-2)" onClick={() => setModal("storage")} icon={<AccountIcon />} />
        )}
      </nav>

      {modal === "storage" && <StorageModal onClose={() => setModal(null)} />}
      {modal === "tokens" && <DesignTokensModal onClose={() => setModal(null)} />}
    </div>
  );
}

function NavLink({ label, to, color }: { label: string; to: string; color: string }) {
  return (
    <Link to={to} className="pl-bare" style={{ color, fontWeight: 600, fontSize: 14, transition: "color .15s", textDecoration: "none" }}>
      {label}
    </Link>
  );
}

function BottomItem({ label, color, onClick, icon }: { label: string; color: string; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pl-bare"
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color, fontWeight: 600, fontSize: 11 }}
    >
      {icon}
      {label}
    </button>
  );
}

/** Pill in the header showing used/quota with a tiny progress bar. */
function StorageButton({ onClick }: { onClick: () => void }) {
  const { data } = useUsage();
  const used = data?.used ?? 0;
  const quota = data?.quota ?? 0;
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="pl-storage pl-btn-ghost"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 38,
        padding: "0 14px",
        borderRadius: 10,
        background: "var(--surface)",
        color: "var(--text-2)",
        fontSize: 12.5,
        whiteSpace: "nowrap",
      }}
    >
      <span className="pl-hidem" style={{ width: 50, height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden", display: "inline-block" }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 4 }} />
      </span>
      <span>
        {formatBytes(used)}
        <span className="pl-hidem"> of {formatBytes(quota)}</span>
      </span>
    </button>
  );
}
