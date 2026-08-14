import "server-only";

import { and, asc, count, desc, eq, gt, inArray } from "drizzle-orm";
import {
  categoriesTable,
  db,
  ordersTable,
  productsTable,
  reviewsTable,
  superLikesTable,
  swipesTable,
} from "@workspace/db";

import { formatOrder, formatProduct } from "./format";
import type { AppOrder, AppProduct } from "./format";
import {
  buildTasteProfile,
  rankProducts,
  type TasteProfile,
  type TasteSignal,
} from "./taste";

async function loadSwipeState(sessionId: string): Promise<{
  signals: TasteSignal[];
  decidedIds: Set<number>;
}> {
  const rows = await db
    .select({
      productId: swipesTable.productId,
      direction: swipesTable.direction,
      category: productsTable.category,
      brand: productsTable.brand,
      colors: productsTable.colors,
      price: productsTable.price,
    })
    .from(swipesTable)
    .innerJoin(productsTable, eq(productsTable.id, swipesTable.productId))
    .where(eq(swipesTable.sessionId, sessionId))
    .orderBy(desc(swipesTable.createdAt));

  return {
    signals: rows.map((row) => ({
      direction: row.direction,
      category: row.category,
      brand: row.brand,
      colors: row.colors ?? [],
      price: parseFloat(row.price),
    })),
    decidedIds: new Set(rows.map((r) => r.productId)),
  };
}

export async function getTasteProfile(
  sessionId: string,
): Promise<TasteProfile> {
  if (!sessionId) return buildTasteProfile([]);

  try {
    const { signals } = await loadSwipeState(sessionId);
    return buildTasteProfile(signals);
  } catch {
    return buildTasteProfile([]);
  }
}

export type ProductSort = "price-asc" | "price-desc" | "new";

export async function listProducts({
  category,
  gender,
  sort = "new",
  inStockOnly = false,
  limit = 10,
  sessionId,
  rankByTaste = false,
}: {
  category?: string;
  gender?: "women" | "men";
  sort?: ProductSort;
  inStockOnly?: boolean;
  limit?: number;
  sessionId?: string;
  rankByTaste?: boolean;
} = {}): Promise<AppProduct[]> {
  const productsQuery = db
    .select()
    .from(productsTable)
    .where(
      and(
        category ? eq(productsTable.category, category) : undefined,
        gender ? eq(productsTable.gender, gender) : undefined,
        inStockOnly ? gt(productsTable.stock, 0) : undefined,
      ),
    )
    .orderBy(asc(productsTable.id));

  const [rows, swipeState] = await Promise.all([
    productsQuery,
    sessionId
      ? loadSwipeState(sessionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const sortProducts = (list: AppProduct[]) => {
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") {
      return [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }
    return list;
  };

  if (!rankByTaste || !swipeState) {
    return sortProducts(rows.map(formatProduct)).slice(0, limit);
  }

  const { signals, decidedIds } = swipeState;

  const undecided = rows
    .filter((r) => !decidedIds.has(r.id))
    .map(formatProduct);

  const candidates = undecided.length > 0 ? undecided : rows.map(formatProduct);

  const profile = buildTasteProfile(signals);

  return rankProducts(profile, candidates).slice(0, limit);
}

export type SwipeHistoryEntry = {
  product: AppProduct;
  direction: "pass" | "like" | "super";
  decidedAt: Date;
};

export async function listSwipeHistory(
  sessionId: string,
  { likedOnly = false }: { likedOnly?: boolean } = {},
): Promise<SwipeHistoryEntry[]> {
  if (!sessionId) return [];

  try {
    const rows = await db
      .select({
        product: productsTable,
        direction: swipesTable.direction,
        decidedAt: swipesTable.createdAt,
      })
      .from(swipesTable)
      .innerJoin(productsTable, eq(productsTable.id, swipesTable.productId))
      .where(
        and(
          eq(swipesTable.sessionId, sessionId),
          likedOnly
            ? inArray(swipesTable.direction, ["like", "super"])
            : undefined,
        ),
      )
      .orderBy(desc(swipesTable.createdAt));

    return rows.map((row) => ({
      product: formatProduct(row.product),
      direction: row.direction,
      decidedAt: row.decidedAt,
    }));
  } catch {
    return [];
  }
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
      .where(
        eq(superLikesTable.sessionId, sessionId),
      )
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

export type AppReview = {
  id: number;
  authorName: string;
  rating: number;
  body: string;
  createdAt: Date;
  isMine: boolean;
};

export async function listReviews(
  productId: number,
  sessionId: string,
  limit?: number,
): Promise<AppReview[]> {
  try {
    const rows = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, productId))
      .orderBy(desc(reviewsTable.createdAt));

    const mapped = rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      isMine: Boolean(sessionId) && r.sessionId === sessionId,
    }));

    return limit ? mapped.slice(0, limit) : mapped;
  } catch {
    return [];
  }
}

export async function listCategories(): Promise<
  { id: number; name: string; slug: string; productCount: number }[]
> {
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
