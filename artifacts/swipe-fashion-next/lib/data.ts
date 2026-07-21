import "server-only";

import { and, asc, count, eq, gt } from "drizzle-orm";
import {
  categoriesTable,
  db,
  ordersTable,
  productsTable,
} from "@workspace/db";

import { formatOrder, formatProduct } from "./format";
import type { AppOrder, AppProduct } from "./format";

export async function listProducts({
  category,
  cursor,
  limit = 10,
}: {
  category?: string;
  cursor?: number;
  limit?: number;
} = {}): Promise<{
  products: AppProduct[];
  nextCursor: number | null;
  total: number;
}> {
  const conditions = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (cursor) conditions.push(gt(productsTable.id, cursor));

  // Ambil satu lebih banyak dari limit untuk tahu apakah masih ada halaman berikutnya.
  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(productsTable.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const [totalRow] = await db
    .select({ value: count() })
    .from(productsTable)
    .where(category ? eq(productsTable.category, category) : undefined);

  return {
    products: items.map(formatProduct),
    nextCursor: hasMore ? items[items.length - 1].id : null,
    total: Number(totalRow?.value ?? 0),
  };
}

export async function getProduct(id: number): Promise<AppProduct | null> {
  const [row] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));

  return row ? formatProduct(row) : null;
}

export async function listCategories(): Promise<
  { id: number; name: string; slug: string; productCount: number }[]
> {
  // Satu query dengan group by, menggantikan satu query per kategori.
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      productCount: count(productsTable.id),
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.category, categoriesTable.slug))
    .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.slug)
    .orderBy(asc(categoriesTable.name));

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}

export async function listOrders(sessionId: string): Promise<AppOrder[]> {
  const rows = await db
    .select({ order: ordersTable, product: productsTable })
    .from(ordersTable)
    .leftJoin(productsTable, eq(productsTable.id, ordersTable.productId))
    .where(eq(ordersTable.sessionId, sessionId))
    .orderBy(asc(ordersTable.createdAt));

  return rows.map((row) => formatOrder(row.order, row.product));
}
