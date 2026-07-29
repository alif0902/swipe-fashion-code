import "./load-env";

import { db, categoriesTable, productsTable } from "@workspace/db";

import { categories, products } from "./catalog";

async function seed() {
  console.log("Seeding categories...");
  await db.insert(categoriesTable).values(categories).onConflictDoNothing();

  console.log("Seeding products...");
  await db.insert(productsTable).values(products);

  console.log(
    `Done: ${categories.length} categories, ${products.length} products.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
