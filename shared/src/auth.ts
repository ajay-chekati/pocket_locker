import { z } from "zod";
import type { Plan } from "./constants.js";

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const resendOtpSchema = z.object({
  email: z.string().email().max(254),
});

export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type ResendOtpRequest = z.infer<typeof resendOtpSchema>;

/** Public-safe view of a user (never includes the password hash). */
export interface UserDto {
  id: string;
  email: string;
  plan: Plan;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

/**
 * Returned by signup (and by login when the account isn't verified yet):
 * no token is issued until the emailed OTP is confirmed. Carries the email so
 * the client can move straight to the verification step.
 */
export interface VerificationRequiredResponse {
  verificationRequired: true;
  email: string;
}

/** Error code returned (HTTP 403) when an unverified user tries to log in. */
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";
