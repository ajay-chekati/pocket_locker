import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { MB } from "@pocket-locker/shared";

// In-memory data + storage stubs.
const files: any[] = [];
let objectSize: number | null = null;

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: any) => ({
        id: where.id,
        plan: "free",
      })),
    },
    file: {
      aggregate: vi.fn(async ({ where }: any) => {
        const sum = files
          .filter((f) => f.userId === where.userId && f.status === "ready")
          .reduce((acc, f) => acc + f.size, 0);
        return { _sum: { size: sum || null } };
      }),
      create: vi.fn(async ({ data }: any) => {
        const file = {
          id: `f_${files.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        files.push(file);
        return file;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const file = files.find((f) => f.id === where.id);
        Object.assign(file, data);
        return file;
      }),
      findFirst: vi.fn(async ({ where }: any) =>
        files.find(
          (f) =>
            f.id === where.id &&
            f.userId === where.userId &&
            (!where.status || f.status === where.status),
        ) ?? null,
      ),
      delete: vi.fn(async ({ where }: any) => {
        const i = files.findIndex((f) => f.id === where.id);
        if (i >= 0) files.splice(i, 1);
      }),
    },
  },
}));

const removeObject = vi.fn(async () => {});
vi.mock("../../lib/storage.js", () => ({
  createSignedUploadUrl: vi.fn(async () => "https://signed.example/upload"),
  getObjectSize: vi.fn(async () => objectSize),
  removeObject,
}));

const { createApp } = await import("../../app.js");
const { signToken } = await import("../../lib/jwt.js");
const app = createApp();
const auth = () => `Bearer ${signToken({ sub: "u1", email: "u@e.com" })}`;

const seedReady = (size: number) =>
  files.push({
    id: `ready_${files.length + 1}`,
    userId: "u1",
    name: "old.png",
    mimeType: "image/png",
    size,
    storagePath: "u1/old",
    status: "ready",
    createdAt: new Date(),
  });

const seedPending = (size: number) => {
  const f = {
    id: "p1",
    userId: "u1",
    name: "pic.png",
    mimeType: "image/png",
    size,
    storagePath: "u1/p1",
    status: "pending",
    createdAt: new Date(),
  };
  files.push(f);
  return f;
};

beforeEach(() => {
  files.length = 0;
  objectSize = null;
  removeObject.mockClear();
});

describe("POST /files/upload-url", () => {
  const body = { name: "pic.png", size: 10 * MB, mimeType: "image/png" };

  it("requires auth", async () => {
    const res = await request(app).post("/files/upload-url").send(body);
    expect(res.status).toBe(401);
  });

  it("returns a signed URL + fileId when within quota", async () => {
    const res = await request(app)
      .post("/files/upload-url")
      .set("Authorization", auth())
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.fileId).toBeTypeOf("string");
    expect(res.body.uploadUrl).toContain("https://");
  });

  it("rejects files over the 40 MB per-file cap (validation)", async () => {
    const res = await request(app)
      .post("/files/upload-url")
      .set("Authorization", auth())
      .send({ ...body, size: 41 * MB });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unsupported file types (validation)", async () => {
    const res = await request(app)
      .post("/files/upload-url")
      .set("Authorization", auth())
      .send({ ...body, mimeType: "application/x-msdownload" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects when the declared size exceeds remaining quota", async () => {
    seedReady(95 * MB); // free quota = 100 MB
    const res = await request(app)
      .post("/files/upload-url")
      .set("Authorization", auth())
      .send(body); // +10 MB → over 100 MB
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("QUOTA_EXCEEDED");
  });
});

describe("POST /files/:id/confirm", () => {
  it("finalizes a pending upload and returns the ready file", async () => {
    seedPending(10 * MB);
    objectSize = 10 * MB;
    const res = await request(app)
      .post("/files/p1/confirm")
      .set("Authorization", auth());
    expect(res.status).toBe(200);
    expect(res.body.size).toBe(10 * MB);
    expect(res.body.previewKind).toBe("image");
    expect(files.find((f) => f.id === "p1").status).toBe("ready");
  });

  it("rolls back when the real object exceeds the 40 MB cap", async () => {
    seedPending(10 * MB);
    objectSize = 41 * MB; // lied about size
    const res = await request(app)
      .post("/files/p1/confirm")
      .set("Authorization", auth());
    expect(res.status).toBe(413);
    expect(removeObject).toHaveBeenCalled();
    expect(files.find((f) => f.id === "p1")).toBeUndefined();
  });

  it("rolls back when the real object pushes the user over quota", async () => {
    seedReady(95 * MB);
    seedPending(10 * MB);
    objectSize = 10 * MB;
    const res = await request(app)
      .post("/files/p1/confirm")
      .set("Authorization", auth());
    expect(res.status).toBe(422);
    expect(removeObject).toHaveBeenCalled();
  });

  it("400s when no object was actually uploaded", async () => {
    seedPending(10 * MB);
    objectSize = null;
    const res = await request(app)
      .post("/files/p1/confirm")
      .set("Authorization", auth());
    expect(res.status).toBe(400);
  });

  it("404s for an unknown pending upload", async () => {
    const res = await request(app)
      .post("/files/nope/confirm")
      .set("Authorization", auth());
    expect(res.status).toBe(404);
  });
});
