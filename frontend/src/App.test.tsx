import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App.js";
import { AuthProvider } from "./features/auth/AuthContext.js";

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("shows the landing page to logged-out visitors at the index route", () => {
    renderApp("/");
    expect(
      screen.getByRole("heading", { name: /your files, in your pocket/i }),
    ).toBeInTheDocument();
  });

  it("redirects logged-out users away from protected /uploads to login", () => {
    renderApp("/uploads");
    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });
});
