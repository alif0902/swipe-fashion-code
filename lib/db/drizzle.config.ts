import { defineConfig } from "drizzle-kit";
import path from "path";

// Migrasi/DDL harus lewat koneksi direct (Supabase: port 5432). Transaction
// pooler (6543) tidak mendukung DDL. Pakai DIRECT_URL bila ada, jatuh ke
// DATABASE_URL untuk Postgres lokal yang keduanya sama.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Set DIRECT_URL (atau DATABASE_URL) untuk push — pastikan database sudah di-provision.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
