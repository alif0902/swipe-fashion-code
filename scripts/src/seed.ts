import "./load-env";

import { db, categoriesTable, productsTable } from "@workspace/db";

import { categories, products } from "./catalog";

async function seed() {
  console.log("Seeding categories...");
  await db.insert(categoriesTable).values(categories).onConflictDoNothing();

  const existing = await db
    .select({ name: productsTable.name })
    .from(productsTable);
  const known = new Set(existing.map((row) => row.name));

  const fresh = products.filter((product) => !known.has(product.name));
  const skipped = products.length - fresh.length;

  if (fresh.length > 0) {
    console.log(`Seeding products... (${fresh.length} baru)`);
    await db.insert(productsTable).values(fresh);
    for (const product of fresh) console.log(`  + ${product.name}`);
  }

  if (skipped > 0) {
    console.log(
      `\n${skipped} produk sudah ada, dilewati supaya tidak jadi duplikat.`,
    );
    console.log(
      "Untuk memperbarui harga/foto milik produk yang sudah ada:\n" +
        "  npm run sync-products && npm run set-images",
    );
  }

  console.log(
    `\nDone: ${categories.length} kategori, ${fresh.length} produk disisipkan, ${skipped} dilewati.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
