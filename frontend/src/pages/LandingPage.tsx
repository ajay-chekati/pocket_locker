import { Link } from "react-router-dom";

/** Logged-out marketing page. Copy/structure now; full SaaS styling in design pass. */
export function LandingPage() {
  return (
    <section>
      <h1>Your files, in your pocket.</h1>
      <p>
        Pocket Locker is a dead-simple place to store, browse, and download your
        files. Sign up free and get 100 MB of storage — no clutter, no fuss.
      </p>
      <ul>
        <li>Upload anything up to 40 MB per file</li>
        <li>Find files fast with search and filters</li>
        <li>Download whenever you need them</li>
      </ul>
      <p>
        <Link to="/signup">Get started free</Link> ·{" "}
        <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
