import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// In-memory Prisma stub so auth tests run without a real database.
const users: any[] = [];
vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.email) return users.find((u) => u.email === where.email) ?? null;
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        return null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const user = {
          id: `u_${users.length + 1}`,
          plan: "free",
          createdAt: new Date(),
          ...data,
        };
        users.push(user);
        return user;
      }),
    },
  },
}));

const { createApp } = await import("../../app.js");
const app = createApp();

beforeEach(() => {
  users.length = 0;
});

describe("auth", () => {
  const creds = { email: "Test@Example.com", password: "supersecret" };

  it("signs up, returns a token, and /me resolves the user", async () => {
    const signup = await request(app).post("/auth/signup").send(creds);
    expect(signup.status).toBe(201);
    expect(signup.body.token).toBeTypeOf("string");
    expect(signup.body.user.email).toBe("test@example.com"); // normalized
    expect(signup.body.user).not.toHaveProperty("passwordHash");

    const me = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${signup.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("test@example.com");
    expect(me.body.plan).toBe("free");
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/auth/signup").send(creds);
    const dup = await request(app).post("/auth/signup").send(creds);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("CONFLICT");
  });

  it("validates input (bad email, short password) with 400", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "nope", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/auth/signup").send(creds);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "supersecret" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects wrong password and unknown email identically (401)", async () => {
    await request(app).post("/auth/signup").send(creds);
    const wrongPw = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "wrongpass" });
    const unknown = await request(app)
      .post("/auth/login")
      .send({ email: "ghost@example.com", password: "whatever" });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body.error.message).toBe(unknown.body.error.message);
  });

  it("rejects /me without a token (401)", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
