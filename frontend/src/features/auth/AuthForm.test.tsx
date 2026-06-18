import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthForm } from "./AuthForm.js";
import { AuthProvider } from "./AuthContext.js";

function renderForm() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthForm mode="signup" />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("AuthForm", () => {
  it("shows a validation error for a too-short password without calling the API", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
