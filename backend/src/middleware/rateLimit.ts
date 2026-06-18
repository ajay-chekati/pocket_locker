import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * In-memory rate limiting.
 *
 * TRADEOFF: counters live in this process only, so limits are NOT shared
 * across multiple instances (e.g. autoscaled Cloud Run). For real multi-
 * instance enforcement this needs a shared store (Redis/Upstash). Kept simple
 * and dependency-free for this project; documented rather than hidden.
 */
const isTest = env.NODE_ENV === "test";

const sendLimited = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
  res.status(429).json({
    error: { code: "RATE_LIMITED", message: "Too many requests, slow down" },
  });

/** Stricter limit on auth endpoints to blunt credential-stuffing/brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  handler: sendLimited,
});

/** Looser default limit for general API traffic. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  handler: sendLimited,
});
