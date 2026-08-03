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
 * Menghapus produk duplikat yang bernama sama.
 *
 *   npm run dedupe-products
 *
 * Untuk tiap nama, SATU baris dipertahankan — yang id-nya terkecil, karena itu
 * yang paling lama ada dan paling mungkin sudah dirujuk sesuatu. Salinannya
 * dihapus permanen beserta swipe dan 一目惚れ yang menunjuk ke sana.
 *
 * SALINAN YANG PUNYA PESANAN TIDAK DIHAPUS, dan itu bukan kelalaian: `orders`
 * menyimpan foreign key ke produk, dan menghapusnya berarti riwayat pembelian
 * orang kehilangan nama barangnya. Baris seperti itu dilaporkan di akhir
 * supaya kamu bisa memutuskan sendiri.
 *
 * Versi sebelumnya MENGARSIPKAN baris semacam itu — barisnya tetap ada tapi
 * hilang dari feed. Fitur arsip sudah dibuang dari aplikasi ini, jadi yang
 * tersisa adalah melaporkannya dengan jujur.
 *
 * Aman dijalankan berulang.
 */
async function main() {
  const rows = await db
    .select({ id: productsTable.id, name: productsTable.name })
    .from(productsTable);

  const byName = new Map<string, number[]>();
  for (const row of rows) {
    byName.set(row.name, [...(byName.get(row.name) ?? []), row.id]);
  }

  const extras: number[] = [];
  const keptLog: string[] = [];

  for (const [name, ids] of byName) {
    if (ids.length < 2) continue;
    const [keeper, ...rest] = [...ids].sort((a, b) => a - b);
    extras.push(...rest);
    keptLog.push(`  ${name}: simpan #${keeper}, singkirkan ${rest.length} salinan`);
  }

  if (extras.length === 0) {
    console.log(`Tidak ada duplikat. Total ${rows.length} produk.`);
    process.exit(0);
  }

  console.log(`Ditemukan ${extras.length} baris duplikat:`);
  console.log(keptLog.join("\n"));

  const ordered = await db
    .select({ productId: ordersTable.productId })
    .from(ordersTable)
    .where(inArray(ordersTable.productId, extras));

  const blocked = new Set(ordered.map((o) => o.productId));
  const deletable = extras.filter((id) => !blocked.has(id));

  if (deletable.length > 0) {
    await db.transaction(async (tx) => {
      await tx.delete(swipesTable).where(inArray(swipesTable.productId, deletable));
      await tx
        .delete(superLikesTable)
        .where(inArray(superLikesTable.productId, deletable));
      await tx.delete(productsTable).where(inArray(productsTable.id, deletable));
    });
    console.log(`\nDihapus: ${deletable.length} baris.`);
  }

  if (blocked.size > 0) {
    console.log(
      `\nTIDAK dihapus karena punya pesanan: ${[...blocked].map((id) => `#${id}`).join(", ")}` +
        `\nMenghapusnya akan memutus riwayat pembelian. Kalau memang ingin` +
        `\ndisingkirkan dari feed, set stoknya ke 0 lewat panel admin.`,
    );
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productsTable);
  console.log(`\nSisa ${total} baris produk.`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Gagal:", error);
  process.exit(1);
});
