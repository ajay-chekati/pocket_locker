import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "../../App.js";
import { renderWithProviders } from "../../test/render.js";

describe("VerifyOtpPage", () => {
  it("shows the verification prompt with the pending email", async () => {
    renderWithProviders(<App />, {
      initialEntries: [{ pathname: "/verify", state: { email: "user@example.com" } }],
    });
    expect(
      await screen.findByRole("heading", { name: /verify your email/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("redirects to signup when reached without a pending email", async () => {
    renderWithProviders(<App />, { initialEntries: [{ pathname: "/verify" }] });
    expect(
      await screen.findByRole("heading", { name: /create your locker/i }),
    ).toBeInTheDocument();
  });
});
