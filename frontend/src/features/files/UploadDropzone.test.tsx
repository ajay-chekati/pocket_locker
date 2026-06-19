import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { MAX_FILE_SIZE_BYTES } from "@pocket-locker/shared";
import { UploadDropzone } from "./UploadDropzone.js";

function renderDropzone() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <UploadDropzone />
    </QueryClientProvider>,
  );
}

const fileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

// fireEvent.change sets files directly, bypassing the input's `accept` filter —
// this mirrors a drag-drop or a renamed file reaching the validation logic.
const selectFile = (file: File) =>
  fireEvent.change(fileInput(), { target: { files: [file] } });

describe("UploadDropzone client-side validation", () => {
  it("rejects an unsupported file type before any upload", async () => {
    renderDropzone();
    selectFile(new File(["x"], "evil.exe", { type: "application/x-msdownload" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /unsupported file type/i,
    );
  });

  it("rejects a file over the 40 MB cap before any upload", async () => {
    renderDropzone();
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: MAX_FILE_SIZE_BYTES + 1 });
    selectFile(big);
    expect(await screen.findByRole("alert")).toHaveTextContent(/40 MB/i);
  });
});
