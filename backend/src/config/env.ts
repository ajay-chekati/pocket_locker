import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Validate environment up front so the process fails fast with a clear message
 * instead of erroring deep in a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  SUPABASE_BUCKET: z.string().default("files"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Email / SMTP for signup OTP. All optional: if SMTP_HOST is blank, the
  // mailer falls back to logging the OTP (dev mode).
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  // z.coerce.boolean treats any non-empty string as true, so parse explicitly.
  SMTP_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("Pocket Locker <no-reply@pocketlocker.app>"),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
