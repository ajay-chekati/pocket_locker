import type { ReactNode } from "react";
import { Brand } from "../../components/Brand.js";
import { ThemeToggle } from "../../components/ThemeToggle.js";

/** Minimal centered chrome for the login / signup / verify screens. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pl-root" style={{ display: "flex", flexDirection: "column" }}>
      <header
        className="pl-pad"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
          padding: "0 48px",
        }}
      >
        <Brand />
        <ThemeToggle />
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 22px 64px" }}>
        <div className="pl-anim-pop" style={{ width: "100%", maxWidth: 404 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
