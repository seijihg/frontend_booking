import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env.local itself; the file may be absent in CI.
try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the real environment
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
