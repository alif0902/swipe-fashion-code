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

export type AdminSummary = {
  products: number;
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
  stock: number;
  likes: number;
  passes: number;
  supers: number;
  orders: number;
  likeRate: number | null;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const [products, users, swipes, orders, revenue] = await Promise.all([
    db.select({ n: count() }).from(productsTable),
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
    users: Number(users[0]?.n ?? 0),
    swipes: Number(swipes[0]?.n ?? 0),
    orders: Number(orders[0]?.n ?? 0),
    revenue: Number(revenue[0]?.total ?? 0),
  };
}

export async function getProductPerformance(): Promise<ProductPerformance[]> {
  const [rows, orderRows] = await Promise.all([
    db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        brand: productsTable.brand,
        imageUrl: productsTable.imageUrl,
        stock: productsTable.stock,
        likes: sql<number>`count(*) filter (where ${swipesTable.direction} = 'like')`,
        passes: sql<number>`count(*) filter (where ${swipesTable.direction} = 'pass')`,
        supers: sql<number>`count(*) filter (where ${swipesTable.direction} = 'super')`,
      })
      .from(productsTable)
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
      stock: row.stock,
      likes,
      passes,
      supers,
      orders: orderCount.get(row.id) ?? 0,
      likeRate: total === 0 ? null : (likes + supers) / total,
    };
  });
}
