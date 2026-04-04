import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization — db is created on first use, not at module load.
// This allows `npm run build` to succeed without DATABASE_URL set locally;
// the error surfaces at runtime when a page actually queries the database.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  _db = drizzle(neon(url), { schema });
  return _db;
}
