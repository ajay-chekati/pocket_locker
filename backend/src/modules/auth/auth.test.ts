import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// In-memory Prisma stub so auth tests run without a real database.
const users: any[] = [];
const otps: any[] = [];

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
          emailVerified: false,
          createdAt: new Date(),
          ...data,
        };
        users.push(user);
        return user;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const user = users.find((u) => u.id === where.id);
        Object.assign(user, data);
        return user;
      }),
    },
    emailOtp: {
      create: vi.fn(async ({ data }: any) => {
        const otp = {
          id: `o_${otps.length + 1}`,
          attempts: 0,
          consumedAt: null,
          createdAt: new Date(),
          ...data,
        };
        otps.push(otp);
        return otp;
      }),
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        let matches = otps.filter((o) => o.email === where.email);
        if (where.purpose) {
          matches = matches.filter((o) => o.purpose === where.purpose);
        }
        if (where.consumedAt === null) {
          matches = matches.filter((o) => o.consumedAt === null);
        }
        if (orderBy?.createdAt === "desc") {
          matches = [...matches].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        return matches[0] ?? null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const otp = otps.find((o) => o.id === where.id);
        if (data.attempts?.increment) otp.attempts += data.attempts.increment;
        if (data.consumedAt !== undefined) otp.consumedAt = data.consumedAt;
        return otp;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        for (let i = otps.length - 1; i >= 0; i--) {
          if (
            otps[i].email === where.email &&
            (!where.purpose || otps[i].purpose === where.purpose) &&
            (where.consumedAt !== null || otps[i].consumedAt === null)
          ) {
            otps.splice(i, 1);
          }
        }
        return { count: 0 };
      }),
    },
  },
}));

// Capture OTP codes instead of sending email.
const sentCodes: { email: string; code: string }[] = [];
vi.mock("../../lib/mailer.js", () => ({
  sendOtpEmail: vi.fn(async (email: string, code: string) => {
    sentCodes.push({ email, code });
  }),
  sendPasswordResetEmail: vi.fn(async (email: string, code: string) => {
    sentCodes.push({ email, code });
  }),
}));

const { createApp } = await import("../../app.js");
const app = createApp();

const lastCode = () => sentCodes[sentCodes.length - 1].code;
const wrongCode = (code: string) => (code === "000000" ? "111111" : "000000");

/** Register and verify an account, returning its JWT. */
async function registerVerified(email: string, password: string) {
  await request(app).post("/auth/signup").send({ email, password });
  const res = await request(app)
    .post("/auth/verify-otp")
    .send({ email, code: lastCode() });
  return res.body.token as string;
}

beforeEach(() => {
  users.length = 0;
  otps.length = 0;
  sentCodes.length = 0;
});

describe("auth — signup + OTP verification", () => {
  const creds = { email: "Test@Example.com", password: "supersecret" };

  it("signup returns verification-required (no token) and emails a code", async () => {
    const res = await request(app).post("/auth/signup").send(creds);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      verificationRequired: true,
      email: "test@example.com",
    });
    expect(res.body.token).toBeUndefined();
    expect(sentCodes).toHaveLength(1);
    expect(sentCodes[0].code).toMatch(/^\d{6}$/);
  });

  it("verifying the OTP issues a token and /me resolves the user", async () => {
    await request(app).post("/auth/signup").send(creds);
    const verify = await request(app)
      .post("/auth/verify-otp")
      .send({ email: "test@example.com", code: lastCode() });
    expect(verify.status).toBe(200);
    expect(verify.body.token).toBeTypeOf("string");
    expect(verify.body.user.email).toBe("test@example.com");
    expect(verify.body.user).not.toHaveProperty("passwordHash");

    const me = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${verify.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("test@example.com");
  });

  it("rejects an incorrect code and locks out after too many attempts", async () => {
    await request(app).post("/auth/signup").send(creds);
    const bad = wrongCode(lastCode());

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ email: "test@example.com", code: bad });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe("Incorrect code");
    }
    const lockedOut = await request(app)
      .post("/auth/verify-otp")
      .send({ email: "test@example.com", code: bad });
    expect(lockedOut.body.error.message).toMatch(/too many attempts/i);
  });

  it("validates input (bad email, short password) with 400", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "nope", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects re-signup of an already-verified email with 409", async () => {
    await registerVerified("dup@example.com", "supersecret");
    const dup = await request(app)
      .post("/auth/signup")
      .send({ email: "dup@example.com", password: "supersecret" });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("CONFLICT");
  });
});

describe("auth — resend", () => {
  it("enforces a cooldown between sends", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "rs@example.com", password: "supersecret" });
    const res = await request(app)
      .post("/auth/resend-otp")
      .send({ email: "rs@example.com" });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });

  it("issues a fresh code once the cooldown passes", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "rs2@example.com", password: "supersecret" });
    // Backdate the existing code past the cooldown window.
    otps[0].createdAt = new Date(Date.now() - 2 * 60 * 1000);

    const res = await request(app)
      .post("/auth/resend-otp")
      .send({ email: "rs2@example.com" });
    expect(res.status).toBe(200);
    expect(sentCodes).toHaveLength(2);

    const verify = await request(app)
      .post("/auth/verify-otp")
      .send({ email: "rs2@example.com", code: lastCode() });
    expect(verify.status).toBe(200);
  });
});

describe("auth — login", () => {
  it("blocks an unverified account with 403 and re-sends a code", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ email: "u@example.com", password: "supersecret" });
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "u@example.com", password: "supersecret" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
    expect(sentCodes.length).toBeGreaterThan(1); // signup + login re-send
  });

  it("logs in a verified account", async () => {
    await registerVerified("v@example.com", "supersecret");
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "v@example.com", password: "supersecret" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects wrong password and unknown email identically (401)", async () => {
    await registerVerified("real@example.com", "supersecret");
    const wrongPw = await request(app)
      .post("/auth/login")
      .send({ email: "real@example.com", password: "wrongpass" });
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

describe("auth — forgot/reset password", () => {
  it("emails a reset code for a verified account and resets the password", async () => {
    await registerVerified("fp@example.com", "supersecret");
    sentCodes.length = 0;

    const forgot = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "fp@example.com" });
    expect(forgot.status).toBe(202);
    expect(sentCodes).toHaveLength(1);

    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ email: "fp@example.com", code: lastCode(), password: "brandnewpw" });
    expect(reset.status).toBe(200);
    expect(reset.body.token).toBeTypeOf("string");

    // Old password no longer works; the new one does.
    const oldPw = await request(app)
      .post("/auth/login")
      .send({ email: "fp@example.com", password: "supersecret" });
    expect(oldPw.status).toBe(401);
    const newPw = await request(app)
      .post("/auth/login")
      .send({ email: "fp@example.com", password: "brandnewpw" });
    expect(newPw.status).toBe(200);
  });

  it("returns 202 without emailing for an unknown address (no enumeration)", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "ghost@example.com" });
    expect(res.status).toBe(202);
    expect(sentCodes).toHaveLength(0);
  });

  it("rejects a wrong reset code, then locks out after too many attempts", async () => {
    await registerVerified("fp2@example.com", "supersecret");
    sentCodes.length = 0;
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: "fp2@example.com" });
    const bad = wrongCode(lastCode());

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ email: "fp2@example.com", code: bad, password: "brandnewpw" });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe("Incorrect code");
    }
    const lockedOut = await request(app)
      .post("/auth/reset-password")
      .send({ email: "fp2@example.com", code: bad, password: "brandnewpw" });
    expect(lockedOut.body.error.message).toMatch(/too many attempts/i);
  });

  it("does not re-send a reset code within the cooldown window", async () => {
    await registerVerified("fp3@example.com", "supersecret");
    sentCodes.length = 0;
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: "fp3@example.com" });
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: "fp3@example.com" });
    expect(sentCodes).toHaveLength(1); // second request suppressed by cooldown
  });

  it("validates a short new password with 400", async () => {
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ email: "fp@example.com", code: "123456", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
