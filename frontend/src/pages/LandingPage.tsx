import { Link } from "react-router-dom";
import { Brand, BRAND } from "../components/Brand.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { Equalizer } from "../components/Equalizer.js";

/** Logged-out marketing page. Carries its own header + footer chrome. */
export function LandingPage() {
  return (
    <div className="pl-root">
      <div className="pl-anim-up">
        <header
          className="pl-pad"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
            padding: "0 48px",
            background: "color-mix(in srgb,var(--bg) 86%,transparent)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Brand />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <Link
              to="/login"
              className="pl-btn-ghost"
              style={{ height: 40, padding: "0 18px", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", textDecoration: "none" }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="pl-btn-primary"
              style={{ height: 40, padding: "0 20px", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", textDecoration: "none" }}
            >
              Get started
            </Link>
          </div>
        </header>

        <section
          className="pl-pad pl-herog"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 72,
            alignItems: "center",
            maxWidth: 1240,
            margin: "0 auto",
            padding: "96px 48px 88px",
          }}
        >
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".18em", color: "var(--accent)", marginBottom: 24 }}>
              POCKET LOCKER — FILE STORAGE
            </div>
            <h1 style={{ fontSize: "clamp(42px,5.4vw,70px)", lineHeight: 1.0, letterSpacing: "-.035em", fontWeight: 800, margin: "0 0 24px" }}>
              Your files,
              <br />
              locked in.
            </h1>
            <p style={{ fontSize: "clamp(16px,1.5vw,19px)", lineHeight: 1.55, color: "var(--text-2)", maxWidth: 440, margin: "0 0 36px" }}>
              A quiet, fast home for the files you actually need. Upload, find, and download from any device — no clutter, no noise.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/signup" className="pl-btn-primary" style={{ height: 52, padding: "0 28px", borderRadius: 11, fontSize: 15.5, display: "flex", alignItems: "center", textDecoration: "none" }}>
                Get started
              </Link>
              <Link to="/login" className="pl-btn-ghost" style={{ height: 52, padding: "0 24px", borderRadius: 11, fontSize: 15.5, display: "flex", alignItems: "center", textDecoration: "none" }}>
                Log in
              </Link>
            </div>
            <div style={{ marginTop: 28, fontSize: 13, color: "var(--muted)", letterSpacing: ".01em" }}>
              Free tier · 100 MB · No card required
            </div>
          </div>

          <HeroPreviewCard />
        </section>

        <section className="pl-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 48px 96px" }}>
          <div className="pl-feat" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            <Feature
              title="Generous free tier"
              body="100 MB of storage and 40 MB per file, free forever. Room for 50 GB lands with Pocket Locker Pro."
              icon={<rect x="4" y="4" width="20" height="20" rx="5" fill="none" stroke="var(--accent)" strokeWidth="1.6" />}
            />
            <Feature
              title="Find it instantly"
              body="Search by name, sort by date or size. The file you need surfaces the moment you look for it."
              icon={<circle cx="14" cy="14" r="10" fill="none" stroke="var(--accent)" strokeWidth="1.6" />}
            />
            <Feature
              title="Quietly secure"
              body="Private by default. Your locker, your files — reachable from any device, exposed to no one."
              icon={<path d="M14 3 L25 14 L14 25 L3 14 Z" fill="none" stroke="var(--accent)" strokeWidth="1.6" />}
            />
          </div>
        </section>

        <section className="pl-pad" style={{ maxWidth: 1240, margin: "0 auto 96px", padding: "0 48px" }}>
          <div style={{ background: "var(--text)", color: "var(--bg)", borderRadius: 24, padding: "80px 48px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(30px,4vw,46px)", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 16px" }}>
              Start in seconds.
            </h2>
            <p style={{ fontSize: 17, color: "color-mix(in srgb,var(--bg) 65%,var(--text))", margin: "0 auto 32px", maxWidth: 420, lineHeight: 1.5 }}>
              Create a locker and drop in your first file. No setup, no card.
            </p>
            <Link to="/signup" className="pl-btn-primary" style={{ height: 52, padding: "0 30px", borderRadius: 11, fontSize: 15.5, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              Get started free
            </Link>
          </div>
        </section>

        <footer
          className="pl-pad"
          style={{
            borderTop: "1px solid var(--border)",
            padding: "26px 48px",
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
          <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
            <Link to="/pro" className="pl-link-muted" style={{ fontWeight: 600, fontSize: 12.5, textDecoration: "none" }}>
              Pro
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Feature({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <div style={{ padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--bg-elev)" }}>
      <svg width="30" height="30" viewBox="0 0 28 28" style={{ marginBottom: 20 }}>
        {icon}
      </svg>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-2)" }}>{body}</div>
    </div>
  );
}

/** The static "browser window" mock shown beside the hero copy. */
function HeroPreviewCard() {
  return (
    <div
      className="pl-hidem"
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        boxShadow: "0 40px 70px -28px var(--shadow),0 10px 24px -12px var(--shadow)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--border)" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--border)" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--border)" }} />
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)", fontFamily: "ui-monospace,monospace" }}>
          pocketlocker.app
        </span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Your files</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>
            <span style={{ width: 46, height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: "68%", background: "var(--accent)", borderRadius: 4 }} />
            </span>
            68.5 / 100 MB
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <MockRow ext="PNG" name="design-mockup.png" size="8.1 MB" />
          <MockRow ext="PDF" name="Q3-Report.pdf" size="4.2 MB" />
        </div>
        <div style={{ marginTop: 14, padding: 16, border: "1.5px dashed var(--accent)", borderRadius: 12, background: "var(--accent-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>roadmap.key</span>
            <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600 }}>64% · 12s left</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Equalizer bars={5} width={3} height={22} gap={3} />
          </div>
          <div style={{ height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                height: "100%",
                width: "64%",
                borderRadius: 4,
                background: "linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#fff))",
                backgroundSize: "200% 100%",
                animation: "plShimmer 1.3s linear infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockRow({ ext, name, size }: { ext: string; name: string; size: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)" }}>
      <span style={{ padding: "3px 7px", borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 10, fontWeight: 700 }}>{ext}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</span>
      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>{size}</span>
    </div>
  );
}
