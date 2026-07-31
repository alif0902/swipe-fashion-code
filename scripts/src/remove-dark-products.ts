import "./load-env";

import { inArray, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  superLikesTable,
  swipesTable,
} from "@workspace/db";

/**
 * Menghapus produk demo berfoto latar gelap dari database.
 *
 * Keempat produk ini sudah dibuang dari catalog.ts beserta berkas gambarnya,
 * jadi baris yang tersisa di database menunjuk ke /assets yang tidak ada lagi —
 * kartu di feed akan tampil kosong. Skrip ini membereskan sisanya.
 *
 * Dicocokkan lewat imageUrl, bukan nama: nama produk bisa diubah lewat admin,
 * sedangkan imageUrl yang filenya sudah terhapus pasti menunjuk data lama ini.
 *
 * Baris yang sudah dirujuk orders / swipes / super_likes DILEWATI — menghapusnya
 * melanggar foreign key dan menghilangkan jejak transaksi. Bersihkan rujukannya
 * dulu kalau memang ingin dihapus.
 *
 * Aman dijalankan berulang.
 */
const DARK_IMAGE_URLS = [
  "/assets/dress-emerald-satin.jpg",
  "/assets/jacket-black-leather.jpg",
  "/assets/jeans-distressed.jpg",
  "/assets/top-black-turtleneck.jpg",
];

async function main() {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      imageUrl: productsTable.imageUrl,
    })
    .from(productsTable)
    .where(inArray(productsTable.imageUrl, DARK_IMAGE_URLS));

  if (rows.length === 0) {
    console.log("Tidak ada produk berlatar gelap tersisa. Tidak ada yang dihapus.");
    process.exit(0);
  }

  console.log(`Ditemukan ${rows.length} produk:`);
  for (const r of rows) console.log(`  #${r.id} ${r.name}`);

  const candidates = rows.map((r) => r.id);

  const referenced = new Set<number>();
  for (const [label, table, column] of [
    ["orders", ordersTable, ordersTable.productId],
    ["swipes", swipesTable, swipesTable.productId],
    ["super_likes", superLikesTable, superLikesTable.productId],
  ] as const) {
    const hits = await db
      .select({ productId: column })
      .from(table)
      .where(inArray(column, candidates));
    for (const h of hits) {
      referenced.add(h.productId);
      console.warn(`  dilewati (dirujuk ${label}): produk id ${h.productId}`);
    }
  }

  const deletable = candidates.filter((id) => !referenced.has(id));
  if (deletable.length === 0) {
    console.log("Semuanya sedang dirujuk. Tidak ada yang dihapus.");
    process.exit(0);
  }

  await db.delete(productsTable).where(inArray(productsTable.id, deletable));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productsTable);

  console.log(`Selesai: ${deletable.length} produk dihapus. Sisa ${total} produk.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
