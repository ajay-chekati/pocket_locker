import { pino } from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  // Pretty output in dev is left to `pino-pretty` via the CLI if desired;
  // structured JSON is the default so logs are machine-parsable in prod.
  base: undefined,
});
