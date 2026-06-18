import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Minimal env so config/env.ts validation passes without a real .env.
    // Tests that touch the DB/storage stub these dependencies.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test",
      JWT_SECRET: "test-secret",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_KEY: "test-service-key",
      SUPABASE_BUCKET: "files",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
