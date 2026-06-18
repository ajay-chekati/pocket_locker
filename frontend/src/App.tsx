import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout.js";
import { HomePage } from "./pages/HomePage.js";
import { UploadsPage } from "./pages/UploadsPage.js";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="uploads" element={<UploadsPage />} />
      </Route>
    </Routes>
  );
}
