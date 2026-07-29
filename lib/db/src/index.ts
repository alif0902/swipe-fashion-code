import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase transaction pooler membatasi koneksi per klien. Di Vercel setiap
// instance serverless punya pool sendiri, jadi pool besar akan menghabiskan
// slot koneksi Postgres. Satu koneksi per instance sudah cukup.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
