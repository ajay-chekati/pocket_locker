import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout.js";
import { HomePage } from "./pages/HomePage.js";
import { UploadsPage } from "./pages/UploadsPage.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { SignupPage } from "./features/auth/SignupPage.js";
import { ProtectedRoute } from "./features/auth/ProtectedRoute.js";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public: index renders landing vs home based on auth. */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />

        {/* Authenticated-only. */}
        <Route element={<ProtectedRoute />}>
          <Route path="uploads" element={<UploadsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
