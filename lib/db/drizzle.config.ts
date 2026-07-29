import { defineConfig } from "drizzle-kit";
import path from "path";

// Kredensial database hanya hidup di satu tempat: .env.local milik aplikasi
// Next. Tapi drizzle-kit adalah proses terpisah yang dijalankan dari lib/db —
// ia tidak tahu apa-apa soal file itu dan Next tidak sedang berjalan untuk
// memuatkannya. Tanpa baris di bawah, `npm run db:push` selalu gagal dari
// shell biasa meskipun .env.local sudah terisi benar.
//
// process.loadEnvFile bawaan Node (>= 20.12) dipakai supaya tidak perlu
// menambah dependency dotenv hanya untuk ini.
const ENV_FILE = path.join(
  __dirname,
  "../../artifacts/swipe-fashion-next/.env.local",
);

try {
  process.loadEnvFile(ENV_FILE);
} catch {
  // Wajar tidak ada di CI atau produksi, yang memakai env var sungguhan.
  // Variabel yang sudah ada di shell tetap menang karena tidak ditimpa.
}

// Migrasi/DDL harus lewat koneksi direct (Supabase: port 5432). Transaction
// pooler (6543) tidak mendukung DDL. Pakai DIRECT_URL bila ada, jatuh ke
// DATABASE_URL untuk Postgres lokal yang keduanya sama.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DIRECT_URL / DATABASE_URL tidak ditemukan.\n" +
      `  Dicari di: ${ENV_FILE}\n` +
      "  Isi kedua baris di file itu (ganti [YOUR-PASSWORD] dengan password\n" +
      "  database Supabase), lalu jalankan ulang. Contoh ada di .env.local.example.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
