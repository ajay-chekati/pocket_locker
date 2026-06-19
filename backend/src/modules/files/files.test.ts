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
      findMany: vi.fn(async ({ where, orderBy, take }: any) => {
        let rows = files.filter((f) => matchesWhere(f, where));
        rows = sortRows(rows, orderBy);
        return take ? rows.slice(0, take) : rows;
      }),
    },
  },
}));

// Minimal in-memory interpreters for the Prisma query shapes listFiles emits.
const comparable = (x: any) => (x instanceof Date ? x.getTime() : x);

function matchesField(actual: any, cond: any): boolean {
  if (cond && typeof cond === "object" && !(cond instanceof Date)) {
    if ("lt" in cond) return comparable(actual) < comparable(cond.lt);
    if ("gt" in cond) return comparable(actual) > comparable(cond.gt);
    if ("contains" in cond) {
      const hay = String(actual).toLowerCase();
      return hay.includes(String(cond.contains).toLowerCase());
    }
  }
  return comparable(actual) === comparable(cond);
}

function matchesWhere(file: any, where: any): boolean {
  if (!where) return true;
  if (Array.isArray(where.AND)) return where.AND.every((w: any) => matchesWhere(file, w));
  if (Array.isArray(where.OR)) return where.OR.some((w: any) => matchesWhere(file, w));
  return Object.entries(where).every(([k, v]) => matchesField(file[k], v));
}

function sortRows(rows: any[], orderBy: any): any[] {
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const spec of specs) {
      const [[field, dir]] = Object.entries(spec) as [[string, string]];
      const av = comparable(a[field]);
      const bv = comparable(b[field]);
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
    }
    return 0;
  });
}

const removeObject = vi.fn(async () => {});
vi.mock("../../lib/storage.js", () => ({
  createSignedUploadUrl: vi.fn(async () => "https://signed.example/upload"),
  createSignedViewUrl: vi.fn(async () => "https://signed.example/view"),
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

// Seed a ready file with explicit name/size/createdAt for ordering assertions.
const seedFile = (
  id: string,
  opts: { name?: string; size?: number; createdAt?: Date; userId?: string } = {},
) =>
  files.push({
    id,
    userId: opts.userId ?? "u1",
    name: opts.name ?? `${id}.png`,
    mimeType: "image/png",
    size: opts.size ?? 1 * MB,
    storagePath: `u1/${id}`,
    status: "ready",
    createdAt: opts.createdAt ?? new Date(),
  });

const list = (qs = "") =>
  request(app).get(`/files${qs}`).set("Authorization", auth());

describe("GET /files", () => {
  it("requires auth", async () => {
    const res = await request(app).get("/files");
    expect(res.status).toBe(401);
  });

  it("returns only the caller's ready files (not pending, not others')", async () => {
    seedFile("a");
    seedPending(5 * MB); // pending → excluded
    seedFile("b", { userId: "u2" }); // other user → excluded
    const res = await list();
    expect(res.status).toBe(200);
    expect(res.body.items.map((f: any) => f.id)).toEqual(["a"]);
    expect(res.body.nextCursor).toBeNull();
  });

  it("defaults to most-recent-first", async () => {
    seedFile("old", { createdAt: new Date("2026-01-01") });
    seedFile("new", { createdAt: new Date("2026-06-01") });
    seedFile("mid", { createdAt: new Date("2026-03-01") });
    const res = await list();
    expect(res.body.items.map((f: any) => f.id)).toEqual(["new", "mid", "old"]);
  });

  it("sorts oldest / largest / smallest", async () => {
    seedFile("s", { size: 1 * MB, createdAt: new Date("2026-01-01") });
    seedFile("l", { size: 9 * MB, createdAt: new Date("2026-02-01") });
    seedFile("m", { size: 5 * MB, createdAt: new Date("2026-03-01") });

    const oldest = await list("?sort=oldest");
    expect(oldest.body.items.map((f: any) => f.id)).toEqual(["s", "l", "m"]);

    const largest = await list("?sort=largest");
    expect(largest.body.items.map((f: any) => f.id)).toEqual(["l", "m", "s"]);

    const smallest = await list("?sort=smallest");
    expect(smallest.body.items.map((f: any) => f.id)).toEqual(["s", "m", "l"]);
  });

  it("filters by filename, case-insensitively", async () => {
    seedFile("a", { name: "Vacation.png" });
    seedFile("b", { name: "invoice.pdf" });
    seedFile("c", { name: "vacation-2.png" });
    const res = await list("?q=vacation");
    expect(res.body.items.map((f: any) => f.id).sort()).toEqual(["a", "c"]);
  });

  it("paginates with a stable cursor and stops cleanly", async () => {
    for (let i = 0; i < 5; i++) {
      seedFile(`f${i}`, { createdAt: new Date(`2026-0${i + 1}-01`) });
    }
    const page1 = await list("?limit=2");
    expect(page1.body.items.map((f: any) => f.id)).toEqual(["f4", "f3"]);
    expect(page1.body.nextCursor).toBeTypeOf("string");

    const page2 = await list(`?limit=2&cursor=${page1.body.nextCursor}`);
    expect(page2.body.items.map((f: any) => f.id)).toEqual(["f2", "f1"]);

    const page3 = await list(`?limit=2&cursor=${page2.body.nextCursor}`);
    expect(page3.body.items.map((f: any) => f.id)).toEqual(["f0"]);
    expect(page3.body.nextCursor).toBeNull();
  });

  it("breaks ties on id when sort values are equal", async () => {
    const same = new Date("2026-05-01");
    seedFile("aaa", { createdAt: same });
    seedFile("bbb", { createdAt: same });
    seedFile("ccc", { createdAt: same });
    const all: string[] = [];
    let cursor = "";
    for (let i = 0; i < 3; i++) {
      const res = await list(`?limit=1${cursor ? `&cursor=${cursor}` : ""}`);
      all.push(...res.body.items.map((f: any) => f.id));
      cursor = res.body.nextCursor;
    }
    expect(all).toEqual(["ccc", "bbb", "aaa"]); // createdAt desc → id desc
  });

  it("400s on a malformed cursor", async () => {
    const res = await list("?cursor=not-a-real-cursor");
    expect(res.status).toBe(400);
  });
});

describe("GET /files/:id/view-url", () => {
  it("returns a signed URL for a ready file the caller owns", async () => {
    seedFile("a");
    const res = await request(app)
      .get("/files/a/view-url")
      .set("Authorization", auth());
    expect(res.status).toBe(200);
    expect(res.body.url).toContain("https://");
  });

  it("404s for someone else's file", async () => {
    seedFile("a", { userId: "u2" });
    const res = await request(app)
      .get("/files/a/view-url")
      .set("Authorization", auth());
    expect(res.status).toBe(404);
  });
});
