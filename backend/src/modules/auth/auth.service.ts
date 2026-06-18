import type { User } from "@prisma/client";
import type { AuthResponse, UserDto } from "@pocket-locker/shared";
import { prisma } from "../../lib/prisma.js";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "../../lib/password.js";
import { signToken } from "../../lib/jwt.js";
import { conflict, unauthorized } from "../../lib/errors.js";

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

export async function signup(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: { email: normalized, passwordHash: await hashPassword(password) },
  });
  return toAuthResponse(user);
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
  return toAuthResponse(user);
}

export async function getUserById(id: string): Promise<UserDto | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserDto(user) : null;
}
