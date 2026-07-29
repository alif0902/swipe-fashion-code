import "./load-env";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  superLikesTable,
  swipesTable,
} from "@workspace/db";

/**
 * Menghapus produk duplikat yang punya nama sama.
 *
 * Kenapa ini pernah terjadi: sync-products dulu mengimpor `products` dari
 * seed.ts, sedangkan seed.ts memanggil seed() di level teratas. Sekadar
 * mengimpornya menjalankan seeding, sehingga 12 produk masuk dua kali.
 * Akarnya sudah diperbaiki — data pindah ke catalog.ts yang bebas efek
 * samping — tapi database yang terlanjur kotor tetap perlu dibersihkan.
 *
 * Aturan yang dipakai:
 * - Untuk tiap nama, baris dengan id TERKECIL dipertahankan. Itu yang paling
 *   mungkin sudah dirujuk pesanan atau swipe.
 * - Duplikat hanya dihapus kalau TIDAK ada satu pun rujukan dari orders,
 *   swipes, atau super_likes. Kalau ada, baris dilewati dan dilaporkan —
 *   menghapusnya akan melanggar foreign key dan menghilangkan jejak transaksi.
 *
 * Aman dijalankan berulang: kalau tidak ada duplikat, ia tidak melakukan apa-apa.
 */
async function dedupe() {
  const rows = await db
    .select({ id: productsTable.id, name: productsTable.name })
    .from(productsTable);

  const byName = new Map<string, number[]>();
  for (const row of rows) {
    byName.set(row.name, [...(byName.get(row.name) ?? []), row.id]);
  }

  const candidates: number[] = [];
  for (const ids of byName.values()) {
    if (ids.length < 2) continue;
    const sorted = [...ids].sort((a, b) => a - b);
    candidates.push(...sorted.slice(1));
  }

  if (candidates.length === 0) {
    console.log(`Tidak ada duplikat. Total ${rows.length} produk.`);
    process.exit(0);
  }

  console.log(`Ditemukan ${candidates.length} baris duplikat.`);

  // Cari duplikat yang sudah terlanjur dirujuk — baris ini tidak boleh dihapus.
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
    console.log("Semua duplikat sedang dirujuk. Tidak ada yang dihapus.");
    process.exit(0);
  }

  await db.delete(productsTable).where(inArray(productsTable.id, deletable));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productsTable);

  console.log(
    `Selesai: ${deletable.length} duplikat dihapus. Sisa ${total} produk.`,
  );
  process.exit(0);
}

dedupe().catch((err) => {
  console.error("Dedupe gagal:", err);
  process.exit(1);
});
