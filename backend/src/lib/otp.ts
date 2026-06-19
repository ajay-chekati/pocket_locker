import bcrypt from "bcryptjs";
import crypto from "node:crypto";

/** Generate a zero-padded 6-digit numeric code (cryptographically random). */
export const generateOtpCode = (): string =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

export const hashOtp = (code: string): Promise<string> => bcrypt.hash(code, 8);

export const verifyOtp = (code: string, hash: string): Promise<boolean> =>
  bcrypt.compare(code, hash);
