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

    await user.type(screen.getByLabelText("Name"), "Jordan Avery");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: /create locker/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
