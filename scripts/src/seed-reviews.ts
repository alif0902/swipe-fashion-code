import "./load-env";

import { isNull } from "drizzle-orm";
import { db, productsTable, reviewsTable } from "@workspace/db";

import { reviews } from "./reviews";

async function main() {
  const products = await db
    .select({ id: productsTable.id, name: productsTable.name })
    .from(productsTable);

  const idByName = new Map(products.map((p) => [p.name, p.id]));

  const deleted = await db
    .delete(reviewsTable)
    .where(isNull(reviewsTable.sessionId))
    .returning({ id: reviewsTable.id });

  if (deleted.length > 0) {
    console.log(`Menghapus ${deleted.length} ulasan bawaan lama.`);
  }

  const rows = [];
  const missing = new Set<string>();

  for (const r of reviews) {
    const productId = idByName.get(r.productName);
    if (!productId) {
      missing.add(r.productName);
      continue;
    }

    rows.push({
      productId,
      sessionId: null,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      createdAt: new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  if (rows.length > 0) {
    await db.insert(reviewsTable).values(rows);
  }

  console.log(`\nSelesai: ${rows.length} ulasan bawaan disisipkan.`);

  if (missing.size > 0) {
    console.warn(
      `\nProduk berikut ada di reviews.ts tapi TIDAK ada di database:\n` +
        [...missing].map((n) => `  ${n}`).join("\n") +
        `\nJalankan npm run seed lebih dulu, atau samakan namanya.`,
    );
  }

  const counts = new Map<number, number>();
  for (const row of rows) {
    counts.set(row.productId, (counts.get(row.productId) ?? 0) + 1);
  }

  const withReviews = products.filter((p) => counts.has(p.id));
  const without = products.filter((p) => !counts.has(p.id));

  console.log(`\nUlasan per produk:`);
  for (const p of withReviews) {
    console.log(`  ${p.name}: ${counts.get(p.id)}`);
  }
  if (without.length > 0) {
    console.log(`\nBelum punya ulasan sama sekali:`);
    for (const p of without) console.log(`  ${p.name}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
