import { defineConfig } from "drizzle-kit";

// Used only to generate migrations (`npm run db:generate`); `npm run db:migrate` applies them
// with our own runner so TLS goes through buildPoolConfig.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./db/migrations",
});
