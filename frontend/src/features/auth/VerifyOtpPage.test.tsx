import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../App.js";
import { AuthProvider } from "./AuthContext.js";

function renderAt(entry: { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("VerifyOtpPage", () => {
  it("shows the verification prompt with the pending email", () => {
    renderAt({ pathname: "/verify", state: { email: "user@example.com" } });
    expect(
      screen.getByRole("heading", { name: /verify your email/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("redirects to signup when reached without a pending email", () => {
    renderAt({ pathname: "/verify" });
    expect(
      screen.getByRole("heading", { name: /create account/i }),
    ).toBeInTheDocument();
  });
});
