import { Link } from "react-router-dom";

export const BRAND = "POCKET LOCKER";

/** The clickable wordmark (red square + spaced caps) used in every header/footer. */
export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="pl-bare"
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
    >
      <span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--accent)" }} />
      <span
        style={{
          fontWeight: 800,
          letterSpacing: ".2em",
          fontSize: 13,
          color: "var(--text)",
        }}
      >
        {BRAND}
      </span>
    </Link>
  );
}
