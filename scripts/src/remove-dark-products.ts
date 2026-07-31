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
 * Menyingkirkan produk demo berfoto latar gelap dari feed dan katalog.
 *
 * Keenam produk ini sudah dibuang dari catalog.ts beserta berkas gambarnya,
 * jadi baris yang tersisa di database menunjuk ke /assets yang tidak ada lagi.
 *
 * DUA HAL YANG PERNAH BIKIN VERSI SEBELUMNYA MELESET:
 *
 * 1. Pencocokan dulu `imageUrl = '...'` persis lewat SQL. Database ini berisi
 *    31 produk padahal katalog cuma 12 — ada duplikat dari bug sync lama, dan
 *    salinannya bisa saja punya imageUrl yang sudah diedit lewat admin atau
 *    foto tambahan di kolom images. Sekarang semua baris ditarik dulu lalu
 *    disaring di JS: cocok bila slug muncul di imageUrl, DI MANA PUN dalam
 *    array images, atau namanya sama dengan salah satu produk demo.
 *
 * 2. Baris yang dirujuk orders/swipes/super_likes dulu cuma DILEWATI, jadi
 *    produknya tetap nongol di feed. Sekarang baris itu diarsipkan
 *    (isArchived = true) — listProducts menyaringnya, sehingga hilang dari
 *    feed dan katalog tanpa melanggar foreign key dan tanpa menghapus jejak
 *    pesanan lama.
 *
 * Aman dijalankan berulang.
 */
const DARK_SLUGS = [
  "dress-emerald-satin",
  "jacket-black-leather",
  "jeans-distressed",
  "top-black-turtleneck",
  "dress-burgundy-silk",
  "coat-camel",
];

const DARK_NAMES = [
  "Emerald Satin Midi Dress",
  "Black Leather Biker Jacket",
  "Distressed Straight Jeans",
  "Black Turtleneck",
  "Burgundy Silk Slip Dress",
  "Camel Wool Overcoat",
];

async function main() {
  const all = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      imageUrl: productsTable.imageUrl,
      images: productsTable.images,
      isArchived: productsTable.isArchived,
    })
    .from(productsTable);

  console.log(`Total produk di database: ${all.length}`);

  const matches = all.filter((p) => {
    const haystack = [p.imageUrl, ...(p.images ?? [])].join(" ");
    return (
      DARK_SLUGS.some((s) => haystack.includes(s)) || DARK_NAMES.includes(p.name)
    );
  });

  if (matches.length === 0) {
    console.log("Tidak ada produk berlatar gelap tersisa.");
    await report();
    process.exit(0);
  }

  console.log(`\nCocok ${matches.length} produk:`);
  for (const m of matches) {
    console.log(`  #${m.id} ${m.name}${m.isArchived ? " (sudah diarsipkan)" : ""}`);
  }

  const ids = matches.map((m) => m.id);

  // Baris yang dirujuk tabel lain tidak boleh dihapus — foreign key akan
  // menolaknya dan riwayat pesanan kehilangan nama barangnya.
  const referenced = new Set<number>();
  for (const [label, table, column] of [
    ["orders", ordersTable, ordersTable.productId],
    ["swipes", swipesTable, swipesTable.productId],
    ["super_likes", superLikesTable, superLikesTable.productId],
  ] as const) {
    const hits = await db
      .select({ productId: column })
      .from(table)
      .where(inArray(column, ids));
    for (const h of hits) referenced.add(h.productId);
    if (hits.length > 0) console.log(`  dirujuk ${label}: ${hits.length} baris`);
  }

  const deletable = ids.filter((id) => !referenced.has(id));
  const archivable = ids.filter((id) => referenced.has(id));

  if (deletable.length > 0) {
    await db.delete(productsTable).where(inArray(productsTable.id, deletable));
    console.log(`\nDihapus: ${deletable.length} produk.`);
  }

  if (archivable.length > 0) {
    await db
      .update(productsTable)
      .set({ isArchived: true })
      .where(inArray(productsTable.id, archivable));
    console.log(
      `Diarsipkan (dirujuk transaksi, tidak bisa dihapus): ${archivable.length} produk.`,
    );
  }

  await report();
  process.exit(0);
}

// Daftar sisa isi katalog, supaya jelas apa yang benar-benar akan muncul di
// feed setelah skrip selesai — termasuk duplikat yang mungkin masih ada.
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
  console.log(`\nSisa ${rows.length} baris, ${active.length} aktif di feed:`);

  const byName = new Map<string, number[]>();
  for (const r of active) {
    byName.set(r.name, [...(byName.get(r.name) ?? []), r.id]);
  }
  for (const [name, list] of byName) {
    const dup = list.length > 1 ? `  ← ${list.length}x DUPLIKAT` : "";
    console.log(`  ${name} (#${list.join(", #")})${dup}`);
  }

  const dupCount = [...byName.values()].filter((v) => v.length > 1).length;
  if (dupCount > 0) {
    console.log(
      `\n${dupCount} nama punya duplikat. Jalankan: npm run dedupe-products`,
    );
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productsTable);
  console.log(`\ncount(*) = ${total}`);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
