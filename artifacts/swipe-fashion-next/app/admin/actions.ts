"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import {
  adminAuditLogTable,
  db,
  ordersTable,
  productsTable,
} from "@workspace/db";

import { requireAdmin } from "@/lib/session";
import { putDataUrl } from "@/lib/storage";
import { productSchema, type ProductInput } from "@/lib/validation";

export type AdminResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Setiap aksi di berkas ini memanggil requireAdmin() sebagai baris pertama.
 *
 * Bukan karena berlebihan, tapi karena Server Action bisa dipanggil LANGSUNG
 * lewat request HTTP tanpa pernah membuka halamannya. Menjaga layout admin
 * saja berarti pintunya dikunci sementara jendelanya terbuka lebar.
 */

async function writeAudit(
  actor: { id: string; email: string },
  action: string,
  targetId: number | null,
  summary: string,
) {
  // Kegagalan mencatat audit tidak boleh menggagalkan tindakannya. Dicatat ke
  // konsol supaya tetap ketahuan kalau tabelnya belum di-push.
  try {
    await db.insert(adminAuditLogTable).values({
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetId,
      summary,
    });
  } catch (error) {
    console.error("[admin] gagal menulis catatan audit:", error);
  }
}

export async function uploadProductImageAction(
  dataUrl: string,
): Promise<AdminResult<string>> {
  await requireAdmin();

  const stored = await putDataUrl(dataUrl, "products");
  if (!stored.ok) return { ok: false, error: stored.error };

  return { ok: true, data: stored.url };
}

function toRow(input: ProductInput) {
  const [first, ...rest] = input.images;

  return {
    name: input.name,
    brand: input.brand,
    // numeric Postgres menerima string; toFixed menjaga dua desimal tetap
    // konsisten dengan data seed.
    price: input.price.toFixed(2),
    originalPrice: input.originalPrice ? input.originalPrice.toFixed(2) : null,
    description: input.description,
    // Foto pertama jadi gambar utama; sisanya jadi carousel. Satu sumber
    // kebenaran, jadi admin tidak perlu memilih dua kali.
    imageUrl: first,
    images: [first, ...rest],
    category: input.category,
    gender: input.gender,
    sizes: input.sizes,
    colors: input.colors,
    material: input.material?.trim() || null,
    dimensions: input.dimensions,
    stock: input.stock,
    isNew: input.isNew,
    isSale: input.isSale,
  };
}

export async function createProductAction(
  input: ProductInput,
): Promise<AdminResult<number>> {
  const admin = await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const [created] = await db
    .insert(productsTable)
    .values(toRow(parsed.data))
    .returning({ id: productsTable.id });

  await writeAudit(
    { id: admin.id, email: admin.email },
    "product.create",
    created.id,
    `${parsed.data.brand} ${parsed.data.name}`,
  );

  revalidatePath("/admin/products");
  revalidatePath("/feed");
  revalidatePath("/lookbook");
  return { ok: true, data: created.id };
}

export async function updateProductAction(
  id: number,
  input: ProductInput,
): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  await db
    .update(productsTable)
    .set(toRow(parsed.data))
    .where(eq(productsTable.id, id));

  await writeAudit(
    { id: admin.id, email: admin.email },
    "product.update",
    id,
    `${parsed.data.brand} ${parsed.data.name}`,
  );

  revalidatePath("/admin/products");
  revalidatePath("/feed");
  revalidatePath("/lookbook");
  revalidatePath(`/product/${id}`);
  return { ok: true };
}

/**
 * Arsip, bukan hapus.
 *
 * `swipes`, `super_likes`, dan `orders` semuanya menunjuk ke `products.id`.
 * Menghapus barisnya akan membuat riwayat pesanan orang kehilangan nama
 * barangnya — atau lebih buruk, gagal dengan pelanggaran foreign key yang
 * pesannya tidak bisa dipahami siapa pun.
 *
 * Diarsipkan berarti hilang dari feed dan katalog, tapi seluruh riwayat utuh.
 */
export async function setProductArchivedAction(
  id: number,
  archived: boolean,
): Promise<AdminResult> {
  const admin = await requireAdmin();

  const [product] = await db
    .select({ name: productsTable.name, brand: productsTable.brand })
    .from(productsTable)
    .where(eq(productsTable.id, id));

  if (!product) return { ok: false, error: "商品が見つかりません。" };

  await db
    .update(productsTable)
    .set({ isArchived: archived })
    .where(eq(productsTable.id, id));

  await writeAudit(
    { id: admin.id, email: admin.email },
    archived ? "product.archive" : "product.restore",
    id,
    `${product.brand} ${product.name}`,
  );

  revalidatePath("/admin/products");
  revalidatePath("/feed");
  revalidatePath("/lookbook");
  return { ok: true };
}

/** Dipakai halaman sunting untuk memperingatkan sebelum mengarsipkan. */
export async function countOrdersForProductAction(
  id: number,
): Promise<AdminResult<number>> {
  await requireAdmin();

  const [row] = await db
    .select({ n: count() })
    .from(ordersTable)
    .where(eq(ordersTable.productId, id));

  return { ok: true, data: Number(row?.n ?? 0) };
}
