import "./load-env";

import { existsSync } from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  superLikesTable,
  swipesTable,
} from "@workspace/db";

/**
 * Menyingkirkan produk yang berkas fotonya sudah tidak ada.
 *
 *   npm run archive-missing-images
 *
 * Berbeda dari `remove-dark-products` yang memakai daftar slug tertulis, skrip
 * ini MEMERIKSA berkasnya langsung di disk. Jadi ia tetap benar berapa kali pun
 * kamu menghapus foto lain di kemudian hari, tanpa perlu diedit.
 *
 * Yang dilakukan:
 *
 * 1. Produk yang foto utamanya hilang → disingkirkan dari feed dan 探す
 * 2. Produk yang foto utamanya ada tapi sebagian foto carousel-nya hilang →
 *    barisnya dibersihkan, produknya tetap tampil
 *
 * Menyingkirkan berarti DIHAPUS bila belum pernah disentuh siapa pun, atau
 * DIARSIPKAN bila sudah ada swipe/pesanan yang menunjuk ke sana. Menghapus
 * baris yang dirujuk akan melanggar foreign key dan membuat riwayat pesanan
 * kehilangan nama barangnya.
 *
 * Aman dijalankan berulang.
 */

// Foto yang diunggah admin tinggal di Vercel Blob dan alamatnya diawali http.
// Berkas semacam itu tidak bisa diperiksa dari disk, jadi dilewati — skrip ini
// hanya mengurus aset lokal di public/.
const PUBLIC_DIR = path.resolve(
  import.meta.dirname,
  "../../artifacts/swipe-fashion-next/public",
);

function isLocal(url: string): boolean {
  return url.startsWith("/");
}

function missingLocally(url: string): boolean {
  if (!isLocal(url)) return false;
  // Query string dibuang sebelum dicocokkan ke nama berkas.
  const clean = url.split("?")[0];
  return !existsSync(path.join(PUBLIC_DIR, clean));
}

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

  console.log(`Memeriksa ${all.length} produk terhadap ${PUBLIC_DIR}\n`);

  const broken: typeof all = [];
  const partial: typeof all = [];

  for (const product of all) {
    const gallery = product.images?.length ? product.images : [product.imageUrl];

    if (missingLocally(product.imageUrl)) {
      broken.push(product);
      continue;
    }
    if (gallery.some(missingLocally)) {
      partial.push(product);
    }
  }

  // --- Foto carousel yang hilang: bersihkan, produknya tetap tampil ---
  for (const product of partial) {
    const kept = (product.images ?? []).filter((src) => !missingLocally(src));
    const next = kept.length > 0 ? kept : [product.imageUrl];

    await db
      .update(productsTable)
      .set({ images: next })
      .where(eq(productsTable.id, product.id));

    console.log(
      `Dibersihkan #${product.id} ${product.name}: ${product.images.length} → ${next.length} foto`,
    );
  }

  if (broken.length === 0) {
    console.log(
      partial.length === 0
        ? "Semua foto produk ada. Tidak ada yang perlu diubah."
        : "\nTidak ada produk yang foto utamanya hilang.",
    );
    await report();
    process.exit(0);
  }

  console.log(`\nFoto utama hilang pada ${broken.length} produk:`);
  for (const product of broken) {
    console.log(
      `  #${product.id} ${product.name} → ${product.imageUrl}${
        product.isArchived ? " (sudah diarsipkan)" : ""
      }`,
    );
  }

  const ids = broken.map((p) => p.id);

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
    for (const hit of hits) referenced.add(hit.productId);
    if (hits.length > 0) console.log(`  dirujuk ${label}: ${hits.length} baris`);
  }

  const deletable = ids.filter((id) => !referenced.has(id));
  const archivable = ids.filter((id) => referenced.has(id));

  if (deletable.length > 0) {
    await db.delete(productsTable).where(inArray(productsTable.id, deletable));
    console.log(`\nDihapus: ${deletable.length} produk (belum pernah disentuh).`);
  }

  if (archivable.length > 0) {
    await db
      .update(productsTable)
      .set({ isArchived: true })
      .where(inArray(productsTable.id, archivable));
    console.log(
      `Diarsipkan: ${archivable.length} produk (punya riwayat, tidak bisa dihapus).`,
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

  const byName = new Map<string, number[]>();
  for (const row of active) {
    byName.set(row.name, [...(byName.get(row.name) ?? []), row.id]);
  }
  for (const [name, list] of byName) {
    const dup = list.length > 1 ? `  ← ${list.length}x DUPLIKAT` : "";
    console.log(`  ${name} (#${list.join(", #")})${dup}`);
  }

  const dupes = [...byName.values()].filter((v) => v.length > 1).length;
  if (dupes > 0) {
    console.log(`\n${dupes} nama punya duplikat. Jalankan: npm run dedupe-products`);
  }
}

main().catch((error) => {
  console.error("Gagal:", error);
  process.exit(1);
});
