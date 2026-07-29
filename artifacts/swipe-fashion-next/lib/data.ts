import "server-only";

import { asc, count, desc, eq } from "drizzle-orm";
import {
  categoriesTable,
  db,
  ordersTable,
  productsTable,
  superLikesTable,
} from "@workspace/db";

import { formatOrder, formatProduct } from "./format";
import type { AppOrder, AppProduct } from "./format";

export async function listProducts({
  category,
  limit = 10,
  sessionId,
}: {
  category?: string;
  limit?: number;
  sessionId?: string;
} = {}): Promise<AppProduct[]> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(category ? eq(productsTable.category, category) : undefined)
    .orderBy(asc(productsTable.id));

  // Tanpa sesi (lookbook, landing): perilaku lama — urut id, potong ke limit.
  if (!sessionId) {
    return rows.slice(0, limit).map(formatProduct);
  }

  // Ambil "Obsessed" untuk mem-boost feed + menyembunyikan yang sudah disimpan.
  let likedIds = new Set<number>();
  let likedCategories = new Set<string>();
  let likedBrands = new Set<string>();
  try {
    const liked = await db
      .select({
        id: productsTable.id,
        category: productsTable.category,
        brand: productsTable.brand,
      })
      .from(superLikesTable)
      .innerJoin(productsTable, eq(productsTable.id, superLikesTable.productId))
      .where(eq(superLikesTable.sessionId, sessionId));

    likedIds = new Set(liked.map((l) => l.id));
    likedCategories = new Set(liked.map((l) => l.category));
    likedBrands = new Set(liked.map((l) => l.brand));
  } catch {
    // Tabel super_likes mungkin belum ada — feed tetap jalan tanpa boost.
    return rows.slice(0, limit).map(formatProduct);
  }

  const candidates = rows.filter((r) => !likedIds.has(r.id));

  if (likedCategories.size === 0 && likedBrands.size === 0) {
    return candidates.slice(0, limit).map(formatProduct);
  }

  // Skor 0 = cocok dengan gaya yang di-Obsessed → muncul lebih dulu.
  // Array.sort stabil, jadi urutan id di dalam tiap grup tetap terjaga.
  const score = (r: (typeof candidates)[number]) =>
    likedCategories.has(r.category) || likedBrands.has(r.brand) ? 0 : 1;

  const boosted = [...candidates].sort((a, b) => score(a) - score(b));

  return boosted.slice(0, limit).map(formatProduct);
}

export async function listObsessed(sessionId: string): Promise<AppProduct[]> {
  if (!sessionId) {
    return [];
  }

  try {
    const rows = await db
      .select({ product: productsTable })
      .from(superLikesTable)
      .innerJoin(productsTable, eq(productsTable.id, superLikesTable.productId))
      .where(eq(superLikesTable.sessionId, sessionId))
      .orderBy(desc(superLikesTable.createdAt));

    return rows.map((r) => formatProduct(r.product));
  } catch {
    return [];
  }
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
