import "./load-env";

import { eq } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

/**
 * Menjadikan satu akun sebagai admin.
 *
 *   npm run make-admin -- email@kamu.com
 *
 * Ini SATU-SATUNYA cara peran admin diberikan. Tidak ada halaman pendaftaran
 * admin, tidak ada tombol, tidak ada undangan — karena halaman semacam itu
 * hanyalah target serangan untuk sesuatu yang cuma perlu dilakukan sekali.
 *
 * Menjalankan skrip ini menuntut akses ke terminal dan ke connection string
 * database, yang keduanya hanya kamu punya.
 */
async function main() {
  // process.argv[2] karena npm meneruskan argumen setelah `--`.
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Pemakaian: npm run make-admin -- email@kamu.com");
    process.exit(1);
  }

  const [user] = await db
    .select({ id: userTable.id, name: userTable.name, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.email, email));

  if (!user) {
    console.error(`Tidak ada akun dengan email ${email}.`);
    console.error("Daftar dulu lewat aplikasi, baru jalankan perintah ini.");
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${email} sudah admin. Tidak ada yang diubah.`);
    process.exit(0);
  }

  await db
    .update(userTable)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(userTable.id, user.id));

  console.log(`${user.name} <${email}> sekarang admin.`);
  console.log("Keluar lalu masuk lagi supaya menu アドミン muncul.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
