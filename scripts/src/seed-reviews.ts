import "./load-env";

import { isNull } from "drizzle-orm";
import { db, productsTable, reviewsTable } from "@workspace/db";

import { reviews } from "./reviews";

/**
 * Mengisi ulasan bawaan.
 *
 *   npm run seed-reviews
 *
 * Aman dijalankan berulang: ulasan bawaan (session_id IS NULL) dihapus lebih
 * dulu, ulasan yang ditulis pengunjung TIDAK disentuh. Tanpa penyaring itu,
 * menjalankan ulang akan menggandakan yang bawaan sekaligus menghapus yang
 * asli.
 *
 * SENGAJA TIDAK menyentuh products.rating dan reviewCount. Kedua kolom itu
 * agregat berjalan dari katalog — 61件 dan seterusnya — sementara tabel ini
 * hanya menyimpan segelintir yang bisa dibaca. Menghitung ulang dari sini
 * akan menjatuhkan 61 jadi 5. Lihat penjelasan lengkapnya di schema/reviews.ts.
 */
async function main() {
  const products = await db
    .select({ id: productsTable.id, name: productsTable.name })
    .from(productsTable);

  const idByName = new Map(products.map((p) => [p.name, p.id]));

  // Hanya baris bawaan yang dibersihkan.
  const deleted = await db
    .delete(reviewsTable)
    .where(isNull(reviewsTable.sessionId))
    .returning({ id: reviewsTable.id });

  if (deleted.length > 0) {
    console.log(`Menghapus ${deleted.length} ulasan bawaan lama.`);
  }

  const rows = [];
  const missing = new Set<string>();

  for (const r of reviews) {
    const productId = idByName.get(r.productName);
    if (!productId) {
      missing.add(r.productName);
      continue;
    }

    rows.push({
      productId,
      sessionId: null,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      // Disebar ke belakang supaya urutan「新しい順」punya arti.
      createdAt: new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  if (rows.length > 0) {
    await db.insert(reviewsTable).values(rows);
  }

  console.log(`\nSelesai: ${rows.length} ulasan bawaan disisipkan.`);

  if (missing.size > 0) {
    console.warn(
      `\nProduk berikut ada di reviews.ts tapi TIDAK ada di database:\n` +
        [...missing].map((n) => `  ${n}`).join("\n") +
        `\nJalankan npm run seed lebih dulu, atau samakan namanya.`,
    );
  }

  // Ringkasan per produk supaya ketimpangan langsung terlihat.
  const counts = new Map<number, number>();
  for (const row of rows) {
    counts.set(row.productId, (counts.get(row.productId) ?? 0) + 1);
  }

  const withReviews = products.filter((p) => counts.has(p.id));
  const without = products.filter((p) => !counts.has(p.id));

  console.log(`\nUlasan per produk:`);
  for (const p of withReviews) {
    console.log(`  ${p.name}: ${counts.get(p.id)}`);
  }
  if (without.length > 0) {
    console.log(`\nBelum punya ulasan sama sekali:`);
    for (const p of without) console.log(`  ${p.name}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
