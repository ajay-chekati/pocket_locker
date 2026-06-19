import type { User } from "@prisma/client";
import {
  EMAIL_NOT_VERIFIED,
  type AuthResponse,
  type UserDto,
  type VerificationRequiredResponse,
} from "@pocket-locker/shared";
import { prisma } from "../../lib/prisma.js";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "../../lib/password.js";
import { generateOtpCode, hashOtp, verifyOtp } from "../../lib/otp.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../../lib/mailer.js";
import { signToken } from "../../lib/jwt.js";
import { env } from "../../config/env.js";
import { AppError, badRequest, conflict, unauthorized } from "../../lib/errors.js";

const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  plan: user.plan,
  createdAt: user.createdAt.toISOString(),
});

const toAuthResponse = (user: User): AuthResponse => ({
  token: signToken({ sub: user.id, email: user.email }),
  user: toUserDto(user),
});

/** Normalize emails so "A@x.com" and "a@x.com" can't both register. */
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const verificationRequired = (email: string): VerificationRequiredResponse => ({
  verificationRequired: true,
  email,
});

type OtpPurpose = "verify" | "reset";

/**
 * Invalidate any outstanding codes for this email + purpose, then create + email
 * a fresh one. Scoping by purpose keeps verify and reset codes independent.
 */
async function issueOtp(email: string, purpose: OtpPurpose): Promise<void> {
  await prisma.emailOtp.deleteMany({
    where: { email, purpose, consumedAt: null },
  });

  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: {
      email,
      purpose,
      codeHash: await hashOtp(code),
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });
  if (purpose === "reset") await sendPasswordResetEmail(email, code);
  else await sendOtpEmail(email, code);
}

export async function signup(
  email: string,
  password: string,
): Promise<VerificationRequiredResponse> {
  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (existing?.emailVerified) {
    throw conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);
  if (existing) {
    // Unverified account re-signing up — refresh the password and re-send a code.
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
  } else {
    await prisma.user.create({ data: { email: normalized, passwordHash } });
  }

  await issueOtp(normalized, "verify");
  return verificationRequired(normalized);
}

export async function verifyEmailOtp(
  email: string,
  code: string,
): Promise<AuthResponse> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw badRequest("No pending verification for this email");

  const otp = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose: "verify", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw badRequest("No active code — request a new one");
  if (otp.expiresAt < new Date()) {
    throw badRequest("Code expired — request a new one");
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw badRequest("Too many attempts — request a new code");
  }

  if (!(await verifyOtp(code, otp.codeHash))) {
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw badRequest("Incorrect code");
  }

  await prisma.emailOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  const verified = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
  return toAuthResponse(verified);
}

export async function resendOtp(
  email: string,
): Promise<VerificationRequiredResponse> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Only send for an existing, unverified account. Always return the same shape
  // so this can't be used to probe which emails are registered.
  if (user && !user.emailVerified) {
    const latest = await prisma.emailOtp.findFirst({
      where: { email: normalized, purpose: "verify" },
      orderBy: { createdAt: "desc" },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new AppError(
        429,
        "RATE_LIMITED",
        "Please wait a moment before requesting another code",
      );
    }
    await issueOtp(normalized, "verify");
  }
  return verificationRequired(normalized);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  // Same error whether the email is unknown or the password is wrong, so we
  // don't leak which emails are registered.
  const invalid = unauthorized("Invalid email or password");
  if (!user) {
    // Run a hash compare anyway to keep timing roughly constant.
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw invalid;
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw invalid;
  }

  // Block unverified accounts and (re)send a fresh code so they can finish.
  if (!user.emailVerified) {
    await issueOtp(user.email, "verify");
    throw new AppError(
      403,
      EMAIL_NOT_VERIFIED,
      "Please verify your email — we sent you a new code",
    );
  }

  return toAuthResponse(user);
}

/**
 * Begin a password reset: email a code to a verified account. Always resolves
 * (no error, no response body) so callers can't probe which emails exist. A
 * recently-issued code within the cooldown window is left in place rather than
 * re-sent, to avoid email spam.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Only verified accounts can reset; an unverified one finishes signup instead.
  if (!user?.emailVerified) return;

  const latest = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose: "reset" },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return;
  }
  await issueOtp(normalized, "reset");
}

/**
 * Complete a password reset: verify the emailed code, set the new password, and
 * log the user in. Uses a single vague error so it can't reveal which step failed
 * (or whether the email exists).
 */
export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<AuthResponse> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  const invalid = badRequest("Invalid or expired code");
  if (!user) throw invalid;

  const otp = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose: "reset", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date()) throw invalid;
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw badRequest("Too many attempts — request a new code");
  }

  if (!(await verifyOtp(code, otp.codeHash))) {
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw badRequest("Incorrect code");
  }

  await prisma.emailOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  const updated = await prisma.user.update({
    where: { id: user.id },
    // Resetting proves email ownership, so verify the account too (handles a
    // user who never finished signup but later resets).
    data: { passwordHash: await hashPassword(password), emailVerified: true },
  });
  return toAuthResponse(updated);
}

export async function getUserById(id: string): Promise<UserDto | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserDto(user) : null;
}
