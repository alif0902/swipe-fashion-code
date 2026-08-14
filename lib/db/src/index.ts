import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set.\n" +
      "  Lokal  : isi artifacts/swipe-fashion-next/.env.local (contoh di .env.local.example)\n" +
      "  Vercel : Project Settings -> Environment Variables, pakai connection string\n" +
      "           Transaction pooler Supabase (port 6543), bukan yang direct.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
