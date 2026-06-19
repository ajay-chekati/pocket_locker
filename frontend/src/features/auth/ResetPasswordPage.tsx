import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { resetPasswordSchema } from "@pocket-locker/shared";
import { ApiRequestError } from "../../lib/apiClient.js";
import { Equalizer } from "../../components/Equalizer.js";
import { useToast } from "../../components/ToastProvider.js";
import { AuthLayout } from "./AuthLayout.js";
import { OtpInput } from "./OtpInput.js";
import { useAuth } from "./AuthContext.js";

/** Step 2 of password reset: enter the emailed code + a new password. */
export function ResetPasswordPage() {
  const { resetPassword, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const email = (location.state as { email?: string } | null)?.email;

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No email in navigation state → start over from the email step.
  if (!email) return <Navigate to="/forgot-password" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ email, code, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the code and password");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email, code, password);
      showToast("Password updated");
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.error.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    try {
      await requestPasswordReset(email);
      setCode("");
      showToast("New code sent");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.error.message : "Could not resend the code",
      );
    }
  };

  return (
    <AuthLayout>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        Choose a new password
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 28px" }}>
        We sent a 6-digit code to <span style={{ color: "var(--text)", fontWeight: 600 }}>{email}</span>.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Reset code
          </label>
          <OtpInput
            value={code}
            onChange={(next) => {
              setError(null);
              setCode(next);
            }}
            error={!!error}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            New password
          </label>
          <input
            aria-label="New password"
            className={`pl-input${error ? " pl-input-error" : ""}`}
            style={{ width: "100%", height: 50, padding: "0 16px", borderRadius: 11, fontSize: 15 }}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        {error && <div role="alert" style={{ color: "var(--accent)", fontSize: 12.5, margin: "-6px 0 16px" }}>{error}</div>}

        <button
          type="submit"
          className="pl-btn-primary"
          disabled={submitting}
          style={{ width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, fontSize: 15.5 }}
        >
          {submitting ? (
            <Equalizer bars={4} width={3} height={16} gap={3} color="rgba(255,255,255,.95)" duration={0.9} />
          ) : (
            <span>Update password</span>
          )}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--text-2)" }}>
        Didn't get a code?{" "}
        <button type="button" onClick={onResend} className="pl-bare" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
          Resend
        </button>
      </div>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button type="button" onClick={() => navigate("/login")} className="pl-bare" style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>
          ← Back to log in
        </button>
      </div>
    </AuthLayout>
  );
}
