import "server-only";

import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import {
  categoriesTable,
  db,
  ordersTable,
  productsTable,
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

// Membaca seluruh keputusan swipe sesi ini dan menggabungkannya dengan atribut
// produk, siap dilempar ke mesin selera yang murni.
async function loadTasteSignals(sessionId: string): Promise<TasteSignal[]> {
  const rows = await db
    .select({
      direction: swipesTable.direction,
      category: productsTable.category,
      brand: productsTable.brand,
      colors: productsTable.colors,
      price: productsTable.price,
    })
    .from(swipesTable)
    .innerJoin(productsTable, eq(productsTable.id, swipesTable.productId))
    .where(eq(swipesTable.sessionId, sessionId));

  return rows.map((row) => ({
    direction: row.direction,
    category: row.category,
    brand: row.brand,
    colors: row.colors ?? [],
    // numeric Postgres kembali sebagai string lewat node-postgres.
    price: parseFloat(row.price),
  }));
}

// Profil selera sesi ini. Dipakai feed untuk mengurutkan dan halaman Style DNA
// untuk memvisualkan. Mengembalikan profil kosong bila tabel belum ada.
export async function getTasteProfile(
  sessionId: string,
): Promise<TasteProfile> {
  if (!sessionId) return buildTasteProfile([]);

  try {
    return buildTasteProfile(await loadTasteSignals(sessionId));
  } catch {
    return buildTasteProfile([]);
  }
}

export type ProductSort = "recommended" | "price-asc" | "price-desc" | "new";

export async function listProducts({
  category,
  gender,
  sort = "recommended",
  inStockOnly = false,
  limit = 10,
  sessionId,
}: {
  category?: string;
  gender?: "women" | "men";
  sort?: ProductSort;
  inStockOnly?: boolean;
  limit?: number;
  sessionId?: string;
} = {}): Promise<AppProduct[]> {
  // and() mengabaikan undefined, jadi filter yang tidak dipakai tidak perlu
  // percabangan sendiri.
  const rows = await db
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

  // Pengurutan dilakukan di JS, bukan SQL: kolom price bertipe numeric dan
  // kembali sebagai STRING lewat node-postgres. ORDER BY di SQL memang benar,
  // tapi menyortir setelah formatProduct membuat perbandingannya numerik dan
  // konsisten dengan nilai yang benar-benar dirender.
  const sortProducts = (list: AppProduct[]) => {
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") {
      return [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }
    return list;
  };

  // Tanpa sesi (lookbook, landing): urut id lalu diurutkan sesuai pilihan.
  if (!sessionId) {
    return sortProducts(rows.map(formatProduct)).slice(0, limit);
  }

  // Produk yang sudah diputuskan (suka, super, atau lewat) tidak diulang.
  // Sebelumnya hanya yang di-super-like yang disembunyikan, sehingga barang
  // yang baru saja ditolak bisa muncul lagi di sesi yang sama.
  let signals: TasteSignal[] = [];
  let decidedIds = new Set<number>();
  try {
    signals = await loadTasteSignals(sessionId);

    const decided = await db
      .select({ productId: swipesTable.productId })
      .from(swipesTable)
      .where(eq(swipesTable.sessionId, sessionId));
    decidedIds = new Set(decided.map((d) => d.productId));
  } catch {
    // Tabel swipes mungkin belum di-push — feed tetap jalan tanpa personalisasi.
    return rows.slice(0, limit).map(formatProduct);
  }

  const undecided = rows
    .filter((r) => !decidedIds.has(r.id))
    .map(formatProduct);

  // Kalau SEMUA produk sudah pernah diputuskan, jangan kirim daftar kosong.
  // Katalog demo hanya 12 item — sekali dihabiskan, feed akan kosong permanen
  // untuk sesi itu, dan tombol「もう一度見る」di klien tidak punya apa pun
  // untuk diputar ulang (reset ke awal daftar kosong tetap kosong). Sebagai
  // gantinya seluruh katalog ditawarkan lagi, tetap diurutkan profil selera;
  // swipe berikutnya menimpa keputusan lama lewat onConflictDoUpdate.
  const candidates = undecided.length > 0 ? undecided : rows.map(formatProduct);

  // Pengurutan sepenuhnya diserahkan ke mesin selera yang murni dan teruji.
  // Profil kosong (belum ada swipe) mengembalikan urutan asli apa adanya.
  const profile = buildTasteProfile(signals);

  return rankProducts(profile, candidates).slice(0, limit);
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
