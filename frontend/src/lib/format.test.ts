import { describe, expect, it } from "vitest";
import { formatBytes } from "./format.js";

describe("formatBytes", () => {
  it("formats across units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(40 * 1024 * 1024)).toBe("40 MB");
    expect(formatBytes(50 * 1024 * 1024 * 1024)).toBe("50 GB");
  });
});
