import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

import { products } from "./seed";

// Menyelaraskan produk yang SUDAH ada di database dengan daftar di seed.ts.
//
// Kenapa perlu skrip terpisah: seed.ts memakai plain insert tanpa menghapus
// lebih dulu, jadi menjalankannya ulang pada database terisi akan menggandakan
// katalog. Menghapus lebih dulu pun tidak bisa — tabel orders menyimpan foreign
// key ke products, sehingga baris yang sudah pernah dipesan tidak boleh hilang.
//
// Skrip ini hanya meng-UPDATE kolom yang aman ditimpa, dicocokkan lewat nama
// produk. Stok sengaja TIDAK ikut disentuh: nilainya berubah karena pesanan
// sungguhan, jadi menimpanya akan menghapus jejak transaksi.
async function syncProducts() {
  let updated = 0;
  let missing = 0;

  for (const product of products) {
    const result = await db
      .update(productsTable)
      .set({
        price: product.price,
        originalPrice: product.originalPrice,
        description: product.description,
        images: product.images,
        material: product.material,
        dimensions: product.dimensions,
      })
      .where(eq(productsTable.name, product.name))
      .returning({ id: productsTable.id });

    if (result.length === 0) {
      console.warn(`  tidak ada di database: ${product.name}`);
      missing += 1;
    } else {
      updated += result.length;
    }
  }

  console.log(
    `Selesai: ${updated} baris diperbarui, ${missing} tidak ditemukan.`,
  );
  process.exit(0);
}

syncProducts().catch((err) => {
  console.error("Sync produk gagal:", err);
  process.exit(1);
});
