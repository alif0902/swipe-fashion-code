import { defineConfig } from "drizzle-kit";
import path from "path";

const ENV_FILE = path.join(
  __dirname,
  "../../artifacts/swipe-fashion-next/.env.local",
);

try {
  process.loadEnvFile(ENV_FILE);
} catch {
}

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
