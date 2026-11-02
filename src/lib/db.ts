import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One shared client per server instance (prevents opening too many connections in development).
const globalForDb = globalThis as unknown as { db?: PrismaClient };

function createClient(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");

  // Supabase adds ?sslmode=... and ?pgbouncer=true for Prisma. We handle SSL below instead.
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

  const adapter = new PrismaPg({
    connectionString: url.toString(),
    // Supabase connections are encrypted; its certificate chain is not in Node's default trust list.
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

export function getDb(): PrismaClient {
  if (!globalForDb.db) globalForDb.db = createClient();
  return globalForDb.db;
}
