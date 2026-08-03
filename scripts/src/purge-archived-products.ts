import "./load-env";

import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

/**
 * MENGHAPUS PERMANEN semua produk yang berstatus arsip, beserta seluruh baris
 * yang menunjuk ke sana.
 *
 *   npm run purge-archived-products            # hanya melaporkan
 *   npm run purge-archived-products -- --apply
 *
 * JALANKAN INI SEBELUM `npm run db:push`. Kolom `is_archived` sudah dibuang
 * dari skema Drizzle, jadi push berikutnya akan menghapus kolomnya dari
 * database. Begitu kolomnya hilang, tidak ada lagi cara membedakan produk
 * sampah dari produk hidup — dan baris arsip akan langsung muncul kembali di
 * feed dengan foto yang sudah tidak ada.
 *
 * KENAPA SQL MENTAH, bukan `productsTable.isArchived` seperti skrip lain:
 * kolomnya sudah tidak ada di skema TypeScript, jadi merujuknya lewat Drizzle
 * tidak akan ter-compile. Kolomnya masih ada di DATABASE sampai push
 * dijalankan, dan justru itulah yang perlu dibaca skrip ini. Ini memang skrip
 * transisi sekali pakai — hapus saja setelah selesai.
 *
 * TIDAK BISA DIBATALKAN. Pesanan yang menunjuk ke produk arsip IKUT TERHAPUS:
 * siapa membeli apa, berapa, kapan — semuanya hilang. Laporan di bawah
 * menghitungnya lebih dulu supaya kamu tahu persis apa yang dikorbankan.
 */
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

  // Satu transaksi: gagal di tengah jalan akan meninggalkan produk yang
  // perujuknya sudah hilang sebagian — lebih sulit dibereskan daripada awalnya.
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
