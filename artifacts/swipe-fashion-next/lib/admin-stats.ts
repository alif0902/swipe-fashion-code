import "server-only";

import { count, eq, sql, sum } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  superLikesTable,
  swipesTable,
  userTable,
} from "@workspace/db";

/**
 * Angka untuk dashboard admin.
 *
 * Tidak ada tabel analitik. Semuanya dihitung dari tabel yang sudah ada —
 * `swipes` khususnya, yang selama ini hanya dipakai mesin selera untuk satu
 * orang. Dilihat secara agregat, tabel yang sama menjawab pertanyaan yang
 * berbeda: produk mana yang paling sering DITOLAK.
 *
 * Itu hanya mungkin karena swipe kiri ikut direkam sejak awal. Toko biasa
 * cuma tahu apa yang dibeli; yang ini tahu apa yang dilihat lalu dilewati —
 * dan itu justru sinyal yang lebih berguna untuk memutuskan stok.
 */

export type AdminSummary = {
  products: number;
  archived: number;
  users: number;
  swipes: number;
  orders: number;
  revenue: number;
};

export type ProductPerformance = {
  id: number;
  name: string;
  brand: string;
  imageUrl: string;
  isArchived: boolean;
  stock: number;
  likes: number;
  passes: number;
  supers: number;
  orders: number;
  /** null kalau belum pernah di-swipe — 0% dan "belum ada data" itu berbeda. */
  likeRate: number | null;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  // Semua dijalankan bersamaan. Berurutan berarti enam perjalanan ke Sydney
  // satu per satu, dan dashboard akan terasa menggantung.
  const [products, archived, users, swipes, orders, revenue] = await Promise.all([
    db.select({ n: count() }).from(productsTable),
    db
      .select({ n: count() })
      .from(productsTable)
      .where(eq(productsTable.isArchived, true)),
    db.select({ n: count() }).from(userTable),
    db.select({ n: count() }).from(swipesTable),
    db.select({ n: count() }).from(ordersTable),
    db
      .select({ total: sum(ordersTable.totalPrice) })
      .from(ordersTable)
      .where(eq(ordersTable.paymentStatus, "paid")),
  ]);

  return {
    products: Number(products[0]?.n ?? 0),
    archived: Number(archived[0]?.n ?? 0),
    users: Number(users[0]?.n ?? 0),
    swipes: Number(swipes[0]?.n ?? 0),
    orders: Number(orders[0]?.n ?? 0),
    // sum() mengembalikan string lewat node-postgres, dan null kalau tak ada baris.
    revenue: Number(revenue[0]?.total ?? 0),
  };
}

export async function getProductPerformance(): Promise<ProductPerformance[]> {
  // SATU kueri dengan GROUP BY, bukan satu kueri per produk. Dengan katalog 12
  // item, versi per-produk berarti 12 perjalanan lintas benua untuk memuat
  // satu tabel.
  const [rows, orderRows] = await Promise.all([
    db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        brand: productsTable.brand,
        imageUrl: productsTable.imageUrl,
        isArchived: productsTable.isArchived,
        stock: productsTable.stock,
        likes: sql<number>`count(*) filter (where ${swipesTable.direction} = 'like')`,
        passes: sql<number>`count(*) filter (where ${swipesTable.direction} = 'pass')`,
        supers: sql<number>`count(*) filter (where ${swipesTable.direction} = 'super')`,
      })
      .from(productsTable)
      // leftJoin, bukan innerJoin: produk yang belum pernah di-swipe harus
      // tetap muncul dengan nol, bukan hilang dari tabel.
      .leftJoin(swipesTable, eq(swipesTable.productId, productsTable.id))
      .groupBy(productsTable.id)
      .orderBy(productsTable.id),

    db
      .select({
        productId: ordersTable.productId,
        n: count(),
      })
      .from(ordersTable)
      .groupBy(ordersTable.productId),
  ]);

  const orderCount = new Map(
    orderRows.map((r) => [r.productId, Number(r.n)]),
  );

  return rows.map((row) => {
    const likes = Number(row.likes);
    const passes = Number(row.passes);
    const supers = Number(row.supers);
    const total = likes + passes + supers;

    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      imageUrl: row.imageUrl,
      isArchived: row.isArchived,
      stock: row.stock,
      likes,
      passes,
      supers,
      orders: orderCount.get(row.id) ?? 0,
      // Super like dihitung sebagai suka — memang begitu artinya.
      likeRate: total === 0 ? null : (likes + supers) / total,
    };
  });
}
