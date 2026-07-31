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
 * Menyingkirkan produk duplikat yang bernama sama.
 *
 *   npm run dedupe-products
 *
 * Kenapa duplikatnya ada: sync-products dulu mengimpor `products` dari seed.ts,
 * sedangkan seed.ts memanggil seed() di level teratas. Sekadar mengimpornya
 * menjalankan seeding, sehingga katalog masuk dua kali. Akarnya sudah
 * diperbaiki — data pindah ke catalog.ts yang bebas efek samping — tapi
 * database yang terlanjur kotor tetap perlu dibersihkan.
 *
 * Aturannya:
 *
 * 1. Untuk tiap nama, SATU baris dipertahankan. Yang dipilih adalah id
 *    terkecil di antara yang belum diarsipkan — bukan sekadar id terkecil.
 *    Kalau baris tertua kebetulan sudah diarsipkan, mempertahankannya berarti
 *    produk itu lenyap dari feed padahal masih ada salinan yang sehat.
 *
 * 2. Sisanya dihapus bila belum pernah disentuh, atau DIARSIPKAN bila sudah
 *    ada swipe/pesanan yang menunjuk ke sana.
 *
 * Poin kedua itu perbaikan atas versi sebelumnya, yang hanya MELEWATI duplikat
 * yang sudah dirujuk. Akibatnya duplikat tetap tampil di feed dan 探す, dan
 * skripnya terasa berhasil padahal masalahnya masih ada di layar.
 *
 * Aman dijalankan berulang.
 */
async function main() {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      isArchived: productsTable.isArchived,
    })
    .from(productsTable);

  const byName = new Map<string, typeof rows>();
  for (const row of rows) {
    byName.set(row.name, [...(byName.get(row.name) ?? []), row]);
  }

  const extras: number[] = [];
  const keptLog: string[] = [];

  for (const [name, group] of byName) {
    if (group.length < 2) continue;

    const sorted = [...group].sort((a, b) => a.id - b.id);
    const keeper = sorted.find((r) => !r.isArchived) ?? sorted[0];

    extras.push(...sorted.filter((r) => r.id !== keeper.id).map((r) => r.id));
    keptLog.push(
      `  ${name}: simpan #${keeper.id}, singkirkan ${group.length - 1} salinan`,
    );
  }

  if (extras.length === 0) {
    console.log(`Tidak ada duplikat. Total ${rows.length} produk.`);
    await report();
    process.exit(0);
  }

  console.log(`Ditemukan ${extras.length} baris duplikat:`);
  console.log(keptLog.join("\n"));

  const referenced = new Set<number>();
  for (const [label, table, column] of [
    ["orders", ordersTable, ordersTable.productId],
    ["swipes", swipesTable, swipesTable.productId],
    ["super_likes", superLikesTable, superLikesTable.productId],
  ] as const) {
    const hits = await db
      .select({ productId: column })
      .from(table)
      .where(inArray(column, extras));
    for (const hit of hits) referenced.add(hit.productId);
    if (hits.length > 0) console.log(`  dirujuk ${label}: ${hits.length} baris`);
  }

  const deletable = extras.filter((id) => !referenced.has(id));
  const archivable = extras.filter((id) => referenced.has(id));

  if (deletable.length > 0) {
    await db.delete(productsTable).where(inArray(productsTable.id, deletable));
    console.log(`\nDihapus: ${deletable.length} baris (belum pernah disentuh).`);
  }

  if (archivable.length > 0) {
    await db
      .update(productsTable)
      .set({ isArchived: true })
      .where(inArray(productsTable.id, archivable));
    console.log(
      `Diarsipkan: ${archivable.length} baris (punya riwayat swipe atau pesanan).`,
    );
  }

  await report();
  process.exit(0);
}

async function report() {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      isArchived: productsTable.isArchived,
    })
    .from(productsTable)
    .orderBy(productsTable.name, productsTable.id);

  const active = rows.filter((r) => !r.isArchived);

  console.log(
    `\nSisa ${rows.length} baris, ${active.length} tampil di feed dan 探す:`,
  );
  for (const row of active) {
    console.log(`  #${row.id} ${row.name}`);
  }

  // Pemeriksaan akhir: kalau masih ada nama kembar di antara yang aktif,
  // berarti ada yang meleset dan lebih baik ketahuan di sini.
  const seen = new Map<string, number>();
  for (const row of active) {
    seen.set(row.name, (seen.get(row.name) ?? 0) + 1);
  }
  const still = [...seen.entries()].filter(([, n]) => n > 1);

  console.log(
    still.length === 0
      ? "\nTidak ada nama kembar yang tersisa di feed."
      : `\nMASIH KEMBAR: ${still.map(([n, c]) => `${n} (${c}x)`).join(", ")}`,
  );

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productsTable);
  console.log(`count(*) = ${total}`);
}

main().catch((error) => {
  console.error("Gagal:", error);
  process.exit(1);
});
