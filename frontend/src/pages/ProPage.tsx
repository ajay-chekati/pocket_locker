import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell.js";
import { Equalizer } from "../components/Equalizer.js";
import { useToast } from "../components/ToastProvider.js";
import { ApiRequestError } from "../lib/apiClient.js";
import { proApi } from "../features/pro/proApi.js";
import { useAuth } from "../features/auth/AuthContext.js";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * "Coming soon" Pro page with a waitlist sign-up. The Pro plan has no backend
 * yet; signups are persisted via `POST /waitlist` (idempotent on email).
 */
export function ProPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  // Pre-fill the signed-in user's email; they can still edit before submitting.
  const [email, setEmail] = useState(user?.email ?? "");
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // On a direct visit the user may resolve after mount; fill the still-empty
  // field once it arrives (without clobbering anything the user has typed).
  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email);
  }, [user?.email]);

  const notify = async () => {
    if (!EMAIL_RE.test(email)) {
      showToast("Enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      await proApi.joinWaitlist({ email });
      setJoined(true);
    } catch (err) {
      showToast(
        err instanceof ApiRequestError ? err.error.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <section className="pl-pad pl-anim-up" style={{ maxWidth: 640, margin: "0 auto", padding: "72px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", color: "var(--accent)", background: "var(--accent-soft)" }}>
          COMING SOON
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", height: 56, margin: "40px 0" }}>
          <Equalizer bars={7} width={7} height={56} gap={6} duration={1.1} stagger={0.1} radius={3} />
        </div>

        <h1 style={{ fontSize: "clamp(38px,6vw,60px)", fontWeight: 800, letterSpacing: "-.035em", margin: "0 0 16px" }}>50 GB Pro</h1>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.55, margin: "0 auto 32px", maxWidth: 420 }}>
          A bigger, faster locker is on the way — 50 GB of space, 5 GB per file, and priority transfers. We'll let you know the moment it's ready.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
          <span style={{ padding: "8px 16px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>
            Free — 100 MB · 40 MB / file
          </span>
          <span style={{ padding: "8px 16px", border: "1px solid var(--accent)", borderRadius: 999, fontSize: 13, color: "var(--accent)", fontWeight: 700, background: "var(--accent-soft)" }}>
            Pro — 50 GB · 5 GB / file
          </span>
        </div>

        {joined ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", border: "1px solid var(--accent)", borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 14.5, fontWeight: 700 }}>
            You're on the list — we'll email you.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void notify();
            }}
            style={{ display: "flex", gap: 10, justifyContent: "center", maxWidth: 420, margin: "0 auto", flexWrap: "wrap" }}
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email for the Pro waitlist"
              className="pl-input"
              style={{ flex: 1, minWidth: 200, height: 50, padding: "0 16px", borderRadius: 11, fontSize: 15 }}
            />
            <button type="submit" disabled={submitting} className="pl-btn-primary" style={{ height: 50, padding: "0 24px", borderRadius: 11, fontSize: 15 }}>
              {submitting ? "Joining…" : "Notify me"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 36 }}>
          <button type="button" onClick={() => navigate("/")} className="pl-bare" style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>
            ← Back to home
          </button>
        </div>
      </section>
    </AppShell>
  );
}
