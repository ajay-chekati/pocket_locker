import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { EMAIL_NOT_VERIFIED, loginSchema, signupSchema } from "@pocket-locker/shared";
import { ApiRequestError } from "../../lib/apiClient.js";
import { Equalizer } from "../../components/Equalizer.js";
import { useAuth } from "./AuthContext.js";

type Mode = "login" | "signup";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Styled login/signup card. Validates with the shared zod schemas (so the rules
 * match the backend) and surfaces a message under the relevant field. Signup
 * collects a display name for parity with the design; the backend only needs
 * email + password, so the name isn't sent.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof FieldErrors) =>
    setErrors((e) => ({ ...e, [field]: undefined }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const next: FieldErrors = {};
    if (isSignup && !name.trim()) next.name = "Please enter your name";

    const schema = isSignup ? signupSchema : loginSchema;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" && !next.email) next.email = issue.message;
        if (field === "password" && !next.password) next.password = issue.message;
      }
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (isSignup) {
        const pendingEmail = await signup(parsed.data!);
        navigate("/verify", { state: { email: pendingEmail } });
        return;
      }
      await login(parsed.data!);
      navigate("/");
    } catch (err) {
      // An unverified account can't log in yet — send them to verify instead.
      if (err instanceof ApiRequestError && err.error.code === EMAIL_NOT_VERIFIED) {
        navigate("/verify", { state: { email } });
        return;
      }
      setErrors({
        email:
          err instanceof ApiRequestError ? err.error.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        {isSignup ? "Create your locker" : "Welcome back"}
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 32px" }}>
        {isSignup ? "Free forever — 100 MB to start." : "Sign in to reach your files."}
      </p>

      <form onSubmit={onSubmit} noValidate>
        {isSignup && (
          <Field label="Name" error={errors.name}>
            <input
              aria-label="Name"
              className={`pl-input${errors.name ? " pl-input-error" : ""}`}
              style={inputStyle}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              placeholder="Jordan Avery"
              autoComplete="name"
            />
          </Field>
        )}

        <Field label="Email" error={errors.email}>
          <input
            aria-label="Email"
            className={`pl-input${errors.email ? " pl-input-error" : ""}`}
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" error={errors.password} marginBottom={26}>
          <input
            aria-label="Password"
            className={`pl-input${errors.password ? " pl-input-error" : ""}`}
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </Field>

        <button
          type="submit"
          className="pl-btn-primary"
          disabled={submitting}
          style={{
            width: "100%",
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 11,
            fontSize: 15.5,
          }}
        >
          {submitting ? (
            <Equalizer bars={4} width={3} height={16} gap={3} color="rgba(255,255,255,.95)" duration={0.9} />
          ) : (
            <span>{isSignup ? "Create locker" : "Log in"}</span>
          )}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text-2)" }}>
        {isSignup ? "Already have a locker? " : "New to Pocket Locker? "}
        <button
          type="button"
          onClick={() => navigate(isSignup ? "/login" : "/signup")}
          className="pl-bare"
          style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}
        >
          {isSignup ? "Log in" : "Create one"}
        </button>
      </div>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="pl-bare"
          style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}
        >
          ← Back to home
        </button>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 50,
  padding: "0 16px",
  borderRadius: 11,
  fontSize: 15,
};

function Field({
  label,
  error,
  marginBottom = 18,
  children,
}: {
  label: string;
  error?: string;
  marginBottom?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</label>
      {children}
      {error && (
        <div role="alert" style={{ color: "var(--accent)", fontSize: 12.5, marginTop: 7 }}>
          {error}
        </div>
      )}
    </div>
  );
}
