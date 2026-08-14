import "./load-env";

import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

async function main() {
  const apply = process.argv.includes("--apply");

  const hasColumn = await db.execute(sql`
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'is_archived'
  `);

  if (hasColumn.rows.length === 0) {
    console.log(
      "Kolom is_archived sudah tidak ada di database.\n" +
        "Berarti db:push sudah dijalankan — tidak ada yang bisa dibersihkan lagi.",
    );
    process.exit(0);
  }

  const archived = await db.execute<{ id: number; name: string }>(sql`
    select id, name from products where is_archived = true order by id
  `);

  const rows = archived.rows;
  console.log(`${rows.length} produk berstatus arsip.`);

  if (rows.length === 0) {
    console.log("\nTidak ada yang perlu dibersihkan. Aman untuk db:push.");
    process.exit(0);
  }

  const counts = await db.execute<{
    swipes: number;
    supers: number;
    orders: number;
  }>(sql`
    select
      (select count(*) from swipes      where product_id in (select id from products where is_archived = true)) as swipes,
      (select count(*) from super_likes where product_id in (select id from products where is_archived = true)) as supers,
      (select count(*) from orders      where product_id in (select id from products where is_archived = true)) as orders
  `);

  const { swipes, supers, orders } = counts.rows[0];

  console.log("\nAkan dihapus permanen:");
  for (const r of rows) console.log(`  #${r.id} ${r.name}`);

  console.log("\nBaris yang menunjuk ke sana:");
  console.log(`  swipes       ${swipes}`);
  console.log(`  super_likes  ${supers}`);
  console.log(`  orders       ${orders}${Number(orders) > 0 ? "   <-- RIWAYAT TRANSAKSI" : ""}`);

  if (Number(orders) > 0) {
    console.log(
      `\n  PERHATIAN: ${orders} pesanan ikut terhapus. Kalau di antaranya ada` +
        `\n  pembelian sungguhan, jejaknya tidak bisa dikembalikan.`,
    );
  }

  if (!apply) {
    console.log(
      "\nIni baru laporan — belum ada yang dihapus." +
        "\nKalau sudah yakin:  npm run purge-archived-products -- --apply",
    );
    process.exit(0);
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`delete from swipes      where product_id in (select id from products where is_archived = true)`);
    await tx.execute(sql`delete from super_likes where product_id in (select id from products where is_archived = true)`);
    await tx.execute(sql`delete from orders      where product_id in (select id from products where is_archived = true)`);
    await tx.execute(sql`delete from products    where is_archived = true`);
  });

  const after = await db.execute<{ n: number }>(sql`select count(*)::int as n from products`);

  console.log(`\nSelesai. ${rows.length} produk dihapus, sisa ${after.rows[0].n} baris.`);
  console.log("Sekarang aman:  npm run db:push");
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
