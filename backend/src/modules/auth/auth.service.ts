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
import { sendOtpEmail } from "../../lib/mailer.js";
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

/** Invalidate any outstanding codes, then create + email a fresh one. */
async function issueOtp(email: string): Promise<void> {
  await prisma.emailOtp.deleteMany({ where: { email, consumedAt: null } });

  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: {
      email,
      codeHash: await hashOtp(code),
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });
  await sendOtpEmail(email, code);
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

  await issueOtp(normalized);
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
    where: { email: normalized, consumedAt: null },
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
      where: { email: normalized },
      orderBy: { createdAt: "desc" },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new AppError(
        429,
        "RATE_LIMITED",
        "Please wait a moment before requesting another code",
      );
    }
    await issueOtp(normalized);
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
    await issueOtp(user.email);
    throw new AppError(
      403,
      EMAIL_NOT_VERIFIED,
      "Please verify your email — we sent you a new code",
    );
  }

  return toAuthResponse(user);
}

export async function getUserById(id: string): Promise<UserDto | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserDto(user) : null;
}
