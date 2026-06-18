import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { unauthorized } from "../lib/errors.js";

/** The authenticated user attached to the request by requireAuth. */
export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Reject requests without a valid Bearer token; otherwise attach req.user. */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Missing bearer token");
  }
  const payload = verifyToken(header.slice("Bearer ".length));
  req.user = { id: payload.sub, email: payload.email };
  next();
}
