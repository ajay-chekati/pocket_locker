import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Lazily build a transporter. When SMTP_HOST is blank (typical in dev) we skip
 * real email entirely and log the message instead, so the OTP flow is testable
 * without an SMTP server.
 */
let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
};

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = "Your Pocket Locker verification code";
  const text = `Your verification code is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`;

  const tx = getTransporter();
  if (!tx) {
    // Dev fallback — no SMTP configured.
    logger.info({ to, code }, `[dev] OTP for ${to}: ${code}`);
    return;
  }

  await tx.sendMail({ from: env.SMTP_FROM, to, subject, text });
}
