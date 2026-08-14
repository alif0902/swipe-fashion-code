import "./load-env";

import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

import { products } from "./catalog";

const PUBLIC_DIR = path.resolve(
  process.cwd(),
  "../artifacts/swipe-fashion-next/public",
);

function existsInPublic(urlPath: string): boolean {
  return fs.existsSync(path.join(PUBLIC_DIR, urlPath.replace(/^\//, "")));
}

async function main() {
  let updated = 0;
  let missingProduct = 0;
  const missingFiles: string[] = [];

  for (const product of products) {
    const images = product.images ?? [];

    for (const src of images) {
      if (!existsInPublic(src)) missingFiles.push(`${product.name}: ${src}`);
    }

    const result = await db
      .update(productsTable)
      .set({ images, imageUrl: images[0] ?? product.imageUrl })
      .where(eq(productsTable.name, product.name))
      .returning({ id: productsTable.id });

    if (result.length === 0) {
      console.warn(`  tidak ada di database: ${product.name}`);
      missingProduct += 1;
    } else {
      updated += result.length;
      console.log(`  ${product.name}: ${images.length} foto`);
    }
  }

  console.log(
    `\nSelesai: ${updated} produk diperbarui, ${missingProduct} tidak ditemukan.`,
  );

  if (missingFiles.length > 0) {
    console.error(`\nFile tidak ada di public/ (${missingFiles.length}):`);
    for (const m of missingFiles) console.error(`  ${m}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal set product images:", err);
  process.exit(1);
});
