import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FileDto, Page } from "@pocket-locker/shared";
import type { ListFilesParams } from "./filesApi.js";

const list = vi.fn();
vi.mock("./filesApi.js", () => ({ filesApi: { list: (p: ListFilesParams) => list(p) } }));

const { FileBrowser } = await import("./FileBrowser.js");

const dto = (id: string, name = `${id}.png`): FileDto => ({
  id,
  name,
  size: 1024,
  mimeType: "image/png",
  previewKind: "image",
  createdAt: "2026-06-01T00:00:00.000Z",
});

const page = (items: FileDto[], nextCursor: string | null = null): Page<FileDto> => ({
  items,
  nextCursor,
});

function renderBrowser() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FileBrowser />
    </QueryClientProvider>,
  );
}

beforeEach(() => list.mockReset());

describe("FileBrowser", () => {
  it("lists files returned by the API", async () => {
    list.mockResolvedValue(page([dto("a", "report.pdf"), dto("b", "photo.png")]));
    renderBrowser();
    expect(await screen.findByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });

  it("requests the selected sort when a tab is clicked", async () => {
    list.mockResolvedValue(page([dto("a")]));
    renderBrowser();
    await screen.findByText("a.png");

    fireEvent.click(screen.getByRole("tab", { name: "Largest" }));

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ sort: "largest" })),
    );
  });

  it("loads the next page when 'Load more' is clicked", async () => {
    list
      .mockResolvedValueOnce(page([dto("a")], "cursor-1"))
      .mockResolvedValueOnce(page([dto("b")], null));
    renderBrowser();
    await screen.findByText("a.png");

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("b.png")).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "cursor-1" }),
    );
  });

  it("shows an empty state when there are no files", async () => {
    list.mockResolvedValue(page([]));
    renderBrowser();
    expect(await screen.findByText(/no uploads yet/i)).toBeInTheDocument();
  });
});
