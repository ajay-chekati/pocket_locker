import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "./App.js";
import { renderWithProviders } from "./test/render.js";

describe("App", () => {
  it("shows the landing page to logged-out visitors at the index route", async () => {
    renderWithProviders(<App />, { initialEntries: ["/"] });
    expect(
      await screen.findByRole("heading", { name: /your files,\s*locked in/i }),
    ).toBeInTheDocument();
  });

  it("redirects logged-out users away from protected /uploads to login", async () => {
    renderWithProviders(<App />, { initialEntries: ["/uploads"] });
    expect(
      await screen.findByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
  });
});
