import "./load-env";

import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

/**
 * Mengganti nama produk dari bahasa Inggris ke bahasa Jepang.
 *
 *   npm run rename-products-ja
 *
 * Nama produk adalah satu-satunya teks berbahasa Inggris yang tersisa di kartu
 * feed, dan letaknya paling menonjol — tepat di atas harga. Sisanya sudah
 * Jepang sejak lama, jadi justru namanya yang terlihat seperti belum selesai.
 *
 * Gaya penamaannya mengikuti kebiasaan toko fashion Jepang: katakana untuk
 * bahan dan siluet, tanpa menyebut warna. Warna sudah punya barisnya sendiri
 * di tabel 基本情報 — mengulangnya di nama membuat kartu terasa berulang, dan
 * situs seperti Uniqlo atau ZOZOTOWN memang tidak melakukannya.
 *
 * Dicocokkan berdasarkan nama lama, bukan id, supaya tetap benar meski id di
 * database berbeda dari urutan di catalog.ts. Aman dijalankan berulang: nama
 * yang sudah Jepang tidak akan cocok dengan kunci mana pun.
 */
const RENAMES: Record<string, string> = {
  "White Linen Blazer": "リネンテーラードジャケット",
  "White Poplin Shirt": "コットンポプリンシャツ",
  "Grey Wool Sweater": "ウールクルーネックニット",
  "Navy Tailored Trousers": "ウールテーパードスラックス",
  "Cream Wide-Leg Trousers": "リネンブレンドワイドパンツ",
  "Floral Wrap Skirt": "フラワープリントラップスカート",
};

async function main() {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      isArchived: productsTable.isArchived,
    })
    .from(productsTable);

  let changed = 0;

  for (const row of rows) {
    const next = RENAMES[row.name];
    if (!next) continue;

    await db
      .update(productsTable)
      .set({ name: next })
      .where(eq(productsTable.id, row.id));

    console.log(
      `#${row.id} ${row.name} → ${next}${row.isArchived ? " (arsip)" : ""}`,
    );
    changed++;
  }

  if (changed === 0) {
    console.log("Tidak ada nama yang perlu diubah.");
  } else {
    console.log(`\n${changed} produk diganti namanya.`);
  }

  // Sisa nama berhuruf Latin dilaporkan, bukan didiamkan. Kalau ada produk
  // yang ditambahkan lewat panel admin dengan nama Inggris, di sinilah ia
  // ketahuan — daftar RENAMES di atas tidak akan pernah tahu sendiri.
  const after = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      isArchived: productsTable.isArchived,
    })
    .from(productsTable)
    .orderBy(productsTable.id);

  const latinOnly = after.filter(
    (r) => !r.isArchived && !/[぀-ヿ一-龯]/.test(r.name),
  );

  console.log("\nProduk aktif di feed:");
  for (const row of after.filter((r) => !r.isArchived)) {
    console.log(`  #${row.id} ${row.name}`);
  }

  if (latinOnly.length > 0) {
    console.log(
      `\nMasih berhuruf Latin: ${latinOnly.map((r) => `#${r.id} ${r.name}`).join(", ")}`,
    );
    console.log("Tambahkan ke RENAMES di scripts/src/rename-products-ja.ts.");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Gagal:", error);
  process.exit(1);
});
