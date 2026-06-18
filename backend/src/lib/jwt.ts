import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "./errors.js";

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as JwtPayload).sub !== "string"
    ) {
      throw unauthorized("Invalid token");
    }
    const { sub, email } = decoded as JwtPayload;
    return { sub, email };
  } catch {
    throw unauthorized("Invalid or expired token");
  }
}
