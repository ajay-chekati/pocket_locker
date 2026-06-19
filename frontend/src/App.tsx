import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage.js";
import { UploadsPage } from "./pages/UploadsPage.js";
import { ProPage } from "./pages/ProPage.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { SignupPage } from "./features/auth/SignupPage.js";
import { VerifyOtpPage } from "./features/auth/VerifyOtpPage.js";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage.js";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage.js";
import { ProtectedRoute } from "./features/auth/ProtectedRoute.js";
import { RedirectIfAuthed } from "./features/auth/RedirectIfAuthed.js";

/**
 * Each screen renders its own chrome (landing header/footer, the minimal auth
 * header, or the signed-in app shell), so routes here stay flat — no shared
 * layout wrapper to fight with the three different headers in the design.
 */
export function App() {
  return (
    <Routes>
      {/* Index: landing when logged out, the upload home when signed in. */}
      <Route index element={<HomePage />} />
      {/* Already signed in? Skip the auth forms and go home. */}
      <Route element={<RedirectIfAuthed />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
      </Route>
      <Route path="verify" element={<VerifyOtpPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="pro" element={<ProPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="uploads" element={<UploadsPage />} />
      </Route>
    </Routes>
  );
}
