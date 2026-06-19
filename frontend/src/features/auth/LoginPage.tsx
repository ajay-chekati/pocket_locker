import { AuthLayout } from "./AuthLayout.js";
import { AuthForm } from "./AuthForm.js";

export function LoginPage() {
  return (
    <AuthLayout>
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
