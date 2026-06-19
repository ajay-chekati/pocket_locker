import { Router } from "express";
import { joinWaitlistSchema } from "@pocket-locker/shared";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { joinWaitlist } from "./waitlist.service.js";

// Public router (no auth): the Pro CTA is reachable while logged out. Behind the
// stricter authLimiter since it's an unauthenticated, abuse-prone write.
export const waitlistRouter = Router();

waitlistRouter.post(
  "/waitlist",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = joinWaitlistSchema.parse(req.body);
    res.status(201).json(await joinWaitlist(email));
  }),
);
