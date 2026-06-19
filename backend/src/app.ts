import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { filesRouter } from "./modules/files/files.routes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

/** Build the Express app. Kept separate from server.ts so tests can import it. */
export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  app.use(healthRouter);

  // General rate limit on the API surface; auth routes add a stricter limiter.
  app.use(apiLimiter);
  app.use(authRouter);
  app.use("/files", filesRouter);
  // Further feature routers mounted here in later PRs.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
