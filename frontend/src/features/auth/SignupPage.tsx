import { Link } from "react-router-dom";
import { AuthForm } from "./AuthForm.js";

export function SignupPage() {
  return (
    <section>
      <h1>Create account</h1>
      <AuthForm mode="signup" />
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
