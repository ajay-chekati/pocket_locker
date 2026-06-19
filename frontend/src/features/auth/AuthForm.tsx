import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  EMAIL_NOT_VERIFIED,
  loginSchema,
  signupSchema,
} from "@pocket-locker/shared";
import { ApiRequestError } from "../../lib/apiClient.js";
import { useAuth } from "./AuthContext.js";

type Mode = "login" | "signup";

/** Basic shared form for login and signup. Validation via the shared schemas. */
export function AuthForm({ mode }: { mode: Mode }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  /** Move to the OTP step, carrying the email along. */
  const goVerify = (verifyEmail: string) =>
    navigate("/verify", { state: { email: verifyEmail } });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = mode === "signup" ? signupSchema : loginSchema;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const pendingEmail = await signup(parsed.data);
        goVerify(pendingEmail);
        return;
      }
      await login(parsed.data);
      navigate("/");
    } catch (err) {
      // An unverified account can't log in yet — send them to verify instead.
      if (
        err instanceof ApiRequestError &&
        err.error.code === EMAIL_NOT_VERIFIED
      ) {
        goVerify(parsed.data.email);
        return;
      }
      setError(
        err instanceof ApiRequestError
          ? err.error.message
          : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
      </div>
      <div>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting
          ? "Please wait…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>
    </form>
  );
}
