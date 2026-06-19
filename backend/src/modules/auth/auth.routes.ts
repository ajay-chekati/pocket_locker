import { Router } from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema,
} from "@pocket-locker/shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { notFound } from "../../lib/errors.js";
import {
  getUserById,
  login,
  requestPasswordReset,
  resendOtp,
  resetPassword,
  signup,
  verifyEmailOtp,
} from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/auth/signup",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = signupSchema.parse(req.body);
    // 202 Accepted: account created but pending email verification (no token yet).
    res.status(202).json(await signup(email, password));
  }),
);

authRouter.post(
  "/auth/verify-otp",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, code } = verifyOtpSchema.parse(req.body);
    res.json(await verifyEmailOtp(email, code));
  }),
);

authRouter.post(
  "/auth/resend-otp",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = resendOtpSchema.parse(req.body);
    res.json(await resendOtp(email));
  }),
);

authRouter.post(
  "/auth/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    res.json(await login(email, password));
  }),
);

authRouter.post(
  "/auth/forgot-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(email);
    // 202 Accepted: we never reveal whether the email is registered.
    res.status(202).json({ ok: true });
  }),
);

authRouter.post(
  "/auth/reset-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, code, password } = resetPasswordSchema.parse(req.body);
    res.json(await resetPassword(email, code, password));
  }),
);

authRouter.get(
  "/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user!.id);
    if (!user) throw notFound("User not found");
    res.json(user);
  }),
);
