// Muat kredensial dari .env.local milik aplikasi Next.
//
// Kredensial database hanya hidup di satu berkas itu, dan yang memuatnya
// otomatis cuma Next.js. Skrip di workspace ini (seed, sync-products,
// verify-stock, set-images) adalah proses terpisah — tanpa impor ini mereka
// selalu gagal dengan "DATABASE_URL must be set" meskipun .env.local terisi
// benar. Kasus yang sama pernah terjadi pada drizzle.config.ts.
//
// PENTING: impor berkas ini HARUS jadi impor pertama di tiap skrip, sebelum
// @workspace/db — modul db melempar error saat dievaluasi bila DATABASE_URL
// kosong, dan urutan evaluasi modul ESM mengikuti urutan impor.
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.join(
  here,
  "../../artifacts/swipe-fashion-next/.env.local",
);

try {
  process.loadEnvFile(ENV_FILE);
} catch {
  // Wajar tidak ada di CI — di sana env var diset sungguhan, dan variabel
  // yang sudah ada di shell memang tidak ditimpa oleh loadEnvFile.
}
