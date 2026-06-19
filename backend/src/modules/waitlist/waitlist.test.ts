import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// In-memory Prisma stub so waitlist tests run without a real database.
const entries: { id: string; email: string; createdAt: Date }[] = [];

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    waitlistEntry: {
      findUnique: vi.fn(
        async ({ where }: any) =>
          entries.find((e) => e.email === where.email) ?? null,
      ),
      create: vi.fn(async ({ data }: any) => {
        const entry = {
          id: `w_${entries.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        entries.push(entry);
        return entry;
      }),
    },
  },
}));

const { createApp } = await import("../../app.js");
const app = createApp();

beforeEach(() => {
  entries.length = 0;
});

describe("waitlist — Pro signups", () => {
  it("adds a new email and reports it as a fresh join (201)", async () => {
    const res = await request(app)
      .post("/waitlist")
      .send({ email: "New@Example.com" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ joined: true, alreadyJoined: false });
    // Stored normalized (lowercased).
    expect(entries).toHaveLength(1);
    expect(entries[0].email).toBe("new@example.com");
  });

  it("is idempotent — a duplicate email resolves as alreadyJoined without a second row", async () => {
    await request(app).post("/waitlist").send({ email: "dup@example.com" });
    const again = await request(app)
      .post("/waitlist")
      .send({ email: "DUP@example.com" });
    expect(again.status).toBe(201);
    expect(again.body).toEqual({ joined: true, alreadyJoined: true });
    expect(entries).toHaveLength(1);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await request(app).post("/waitlist").send({ email: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(entries).toHaveLength(0);
  });
});
