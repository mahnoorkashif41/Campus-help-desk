import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma command-line tool (migrations) uses DIRECT_URL.
// The running app uses DATABASE_URL (see src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL ?? "" },
});
