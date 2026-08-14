import "./load-env";

import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

import { products } from "./catalog";

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
        feel: product.feel,
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
