import { Router } from "express";
import { loginSchema, signupSchema } from "@pocket-locker/shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { notFound } from "../../lib/errors.js";
import { getUserById, login, signup } from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/auth/signup",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = signupSchema.parse(req.body);
    const result = await signup(email, password);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/auth/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password);
    res.json(result);
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
