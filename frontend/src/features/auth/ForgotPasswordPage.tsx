import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordSchema } from "@pocket-locker/shared";
import { ApiRequestError } from "../../lib/apiClient.js";
import { Equalizer } from "../../components/Equalizer.js";
import { AuthLayout } from "./AuthLayout.js";
import { useAuth } from "./AuthContext.js";

/** Step 1 of password reset: ask for the email and send a reset code. */
export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.email);
      // Always advance — the API never reveals whether the email is registered.
      navigate("/reset-password", { state: { email: parsed.data.email } });
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.error.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        Reset your password
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 32px" }}>
        Enter your email and we'll send you a 6-digit code.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div style={{ marginBottom: 26 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Email
          </label>
          <input
            aria-label="Email"
            className={`pl-input${error ? " pl-input-error" : ""}`}
            style={{ width: "100%", height: 50, padding: "0 16px", borderRadius: 11, fontSize: 15 }}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {error && (
            <div role="alert" style={{ color: "var(--accent)", fontSize: 12.5, marginTop: 7 }}>
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="pl-btn-primary"
          disabled={submitting}
          style={{ width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, fontSize: 15.5 }}
        >
          {submitting ? (
            <Equalizer bars={4} width={3} height={16} gap={3} color="rgba(255,255,255,.95)" duration={0.9} />
          ) : (
            <span>Send reset code</span>
          )}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button type="button" onClick={() => navigate("/login")} className="pl-bare" style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>
          ← Back to log in
        </button>
      </div>
    </AuthLayout>
  );
}
