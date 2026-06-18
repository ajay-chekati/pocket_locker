import { Link } from "react-router-dom";
import { AuthForm } from "./AuthForm.js";

export function LoginPage() {
  return (
    <section>
      <h1>Sign in</h1>
      <AuthForm mode="login" />
      <p>
        No account? <Link to="/signup">Create one</Link>
      </p>
    </section>
  );
}
