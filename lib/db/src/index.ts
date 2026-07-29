import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Dilempar saat modul di-import, bukan saat query pertama. Next mengimpor
// modul rute selama `next build`, jadi kegagalan ini muncul saat build — itu
// disengaja: lebih baik build gagal dengan pesan jelas daripada deploy sukses
// lalu setiap halaman error 500 di produksi.
//
// Perhatikan tidak ada koneksi yang dibuka di sini; Pool baru menyambung saat
// query pertama. Build hanya butuh string-nya ada, bukan database yang hidup.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set.\n" +
      "  Lokal  : isi artifacts/swipe-fashion-next/.env.local (contoh di .env.local.example)\n" +
      "  Vercel : Project Settings -> Environment Variables, pakai connection string\n" +
      "           Transaction pooler Supabase (port 6543), bukan yang direct.",
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
