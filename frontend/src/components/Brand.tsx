import { Link } from "react-router-dom";
import { LockerMark } from "./LockerMark.js";

export const BRAND = "POCKET LOCKER";

/** The clickable wordmark (locker mark + spaced caps) used in every header/footer. */
export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="pl-bare"
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
    >
      <LockerMark size={26} />
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
