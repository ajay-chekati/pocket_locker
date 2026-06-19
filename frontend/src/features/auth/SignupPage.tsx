import { AuthLayout } from "./AuthLayout.js";
import { AuthForm } from "./AuthForm.js";

export function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
