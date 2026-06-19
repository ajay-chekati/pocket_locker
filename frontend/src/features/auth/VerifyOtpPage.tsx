import { useRef, useState, type KeyboardEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiRequestError } from "../../lib/apiClient.js";
import { Equalizer } from "../../components/Equalizer.js";
import { useToast } from "../../components/ToastProvider.js";
import { AuthLayout } from "./AuthLayout.js";
import { useAuth } from "./AuthContext.js";

const LEN = 6;

/** OTP entry step. Reached after signup or an unverified login attempt. */
export function VerifyOtpPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const email = (location.state as { email?: string } | null)?.email;

  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // No email in navigation state → nothing to verify; send them back to signup.
  if (!email) return <Navigate to="/signup" replace />;

  const focus = (i: number) => refs.current[Math.max(0, Math.min(LEN - 1, i))]?.focus();

  const onChange = (i: number, raw: string) => {
    setError(null);
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((v, k) => (k === i ? "" : v)));
      return;
    }
    // Support pasting several digits at once into one box.
    setDigits((d) => {
      const next = [...d];
      for (let k = 0; k < clean.length && i + k < LEN; k++) next[i + k] = clean[k];
      return next;
    });
    focus(i + clean.length);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      setDigits((d) => d.map((v, k) => (k === i - 1 ? "" : v)));
      focus(i - 1);
    }
  };

  const submit = async () => {
    const code = digits.join("");
    if (code.length < LEN) {
      setError("Enter all 6 digits");
      return;
    }
    setSubmitting(true);
    try {
      await verifyOtp(email, code);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    try {
      await resendOtp(email);
      setDigits(Array(LEN).fill(""));
      focus(0);
      showToast("New code sent");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.error.message : "Could not resend the code");
    }
  };

  return (
    <AuthLayout>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        Verify your email
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 28px" }}>
        We sent a 6-digit code to <span style={{ color: "var(--text)", fontWeight: 600 }}>{email}</span>.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {digits.map((value, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={value}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={LEN}
              aria-label={`Digit ${i + 1}`}
              className={`pl-input${error ? " pl-input-error" : ""}`}
              style={{
                flex: 1,
                width: 0,
                height: 62,
                textAlign: "center",
                borderRadius: 12,
                fontSize: 24,
                fontWeight: 700,
              }}
            />
          ))}
        </div>

        {error && <div style={{ color: "var(--accent)", fontSize: 12.5, margin: "-4px 0 16px" }}>{error}</div>}

        <button
          type="submit"
          className="pl-btn-primary"
          disabled={submitting}
          style={{ width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, fontSize: 15.5 }}
        >
          {submitting ? (
            <Equalizer bars={4} width={3} height={16} gap={3} color="rgba(255,255,255,.95)" duration={0.9} />
          ) : (
            <span>Verify &amp; continue</span>
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
        <button type="button" onClick={() => navigate("/signup")} className="pl-bare" style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>
          ← Back to sign up
        </button>
      </div>
    </AuthLayout>
  );
}
