import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { verifyOtpSchema } from "@pocket-locker/shared";
import { ApiRequestError } from "../../lib/apiClient.js";
import { useAuth } from "./AuthContext.js";

/** OTP entry step. Reached after signup or an unverified login attempt. */
export function VerifyOtpPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No email in navigation state → nothing to verify; send them back to signup.
  if (!email) return <Navigate to="/signup" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = verifyOtpSchema.safeParse({ email, code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(email, code);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.error.message
          : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendOtp(email);
      setInfo("A new code is on its way.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.error.message
          : "Could not resend the code",
      );
    }
  };

  return (
    <section>
      <h1>Verify your email</h1>
      <p>
        Enter the 6-digit code we sent to <strong>{email}</strong>.
      </p>
      <form onSubmit={onSubmit}>
        <label>
          Code
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        {info && <p>{info}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify"}
        </button>
      </form>
      <button type="button" onClick={onResend}>
        Resend code
      </button>
    </section>
  );
}
