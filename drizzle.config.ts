import { config } from 'dotenv'
config({ path: '.env.local' })

import type { Config } from "drizzle-kit";

/**
 * drizzle-kit picks database drivers in order: `pg` runs before `@neondatabase/serverless`.
 * The `pg` devDependency makes `npm run db:migrate` use TCP + SSL to Neon; the serverless
 * package alone forces WebSocket and often fails in the CLI with no useful error.
 */
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use unpooled URL for migrations — pooled connections don't support DDL
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
} satisfies Config;