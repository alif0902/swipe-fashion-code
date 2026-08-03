import "./load-env";

import { db, categoriesTable, productsTable } from "@workspace/db";

import { categories, products } from "./catalog";

/**
 * Mengisi katalog awal. AMAN dijalankan berulang.
 *
 * Versi sebelumnya memakai plain insert tanpa syarat:
 *
 *     await db.insert(productsTable).values(products);
 *
 * Kolom `name` tidak punya unique constraint, jadi tidak ada yang menahan
 * baris kembar — menjalankan seed dua kali menggandakan seluruh katalog, dan
 * feed menampilkan tiap produk dua kali. Itu sudah terjadi lebih dari sekali,
 * dan tiap kali harus dibereskan manual lewat `npm run dedupe-products`.
 *
 * `.onConflictDoNothing()` tidak bisa dipakai di sini: tanpa unique index pada
 * `name`, Postgres tidak punya conflict target untuk disandarkan. Jadi
 * penyaringan dilakukan di sisi aplikasi — baca nama yang sudah ada lebih
 * dulu, lalu sisipkan yang belum ada saja.
 *
 * Catatan: skrip ini sengaja TIDAK meng-update baris yang sudah ada. Untuk
 * menyelaraskan harga, deskripsi, dan foto milik produk yang sudah terdaftar,
 * pakai `npm run sync-products` lalu `npm run set-images`.
 */
async function seed() {
  console.log("Seeding categories...");
  await db.insert(categoriesTable).values(categories).onConflictDoNothing();

  const existing = await db
    .select({ name: productsTable.name })
    .from(productsTable);
  const known = new Set(existing.map((row) => row.name));

  const fresh = products.filter((product) => !known.has(product.name));
  const skipped = products.length - fresh.length;

  if (fresh.length > 0) {
    console.log(`Seeding products... (${fresh.length} baru)`);
    await db.insert(productsTable).values(fresh);
    for (const product of fresh) console.log(`  + ${product.name}`);
  }

  if (skipped > 0) {
    console.log(
      `\n${skipped} produk sudah ada, dilewati supaya tidak jadi duplikat.`,
    );
    console.log(
      "Untuk memperbarui harga/foto milik produk yang sudah ada:\n" +
        "  npm run sync-products && npm run set-images",
    );
  }

  console.log(
    `\nDone: ${categories.length} kategori, ${fresh.length} produk disisipkan, ${skipped} dilewati.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
