"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  superLikesTable,
  swipesTable,
} from "@workspace/db";

import { getSessionId } from "@/lib/session";
import {
  confirmOrderSchema,
  createOrderSchema,
  recordSwipeSchema,
  superLikeSchema,
  type ConfirmOrderInput,
  type CreateOrderInput,
  type RecordSwipeInput,
  type SuperLikeInput,
} from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "注文内容が正しくありません。" };
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    return { ok: false, error: "セッションが見つかりません。" };
  }

  const { productId, selectedSize, selectedColor, quantity } = parsed.data;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    return { ok: false, error: "商品が見つかりません。" };
  }

  if (product.stock < quantity) {
    return { ok: false, error: "在庫が足りません。" };
  }

  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  await db.insert(ordersTable).values({
    sessionId,
    productId,
    selectedSize,
    selectedColor,
    quantity,
    totalPrice,
    status: "pending",
    paymentStatus: "unpaid",
  });

  await db
    .update(productsTable)
    .set({ stock: product.stock - quantity })
    .where(eq(productsTable.id, productId));

  revalidatePath("/orders");
  return { ok: true };
}

// Merekam SATU keputusan swipe, termasuk swipe kiri. Ini bahan bakar mesin
// selera di lib/taste.ts — tanpa sinyal negatif, profil hanya tahu apa yang
// disukai dan tidak pernah belajar apa yang harus dihindari.
export async function recordSwipeAction(
  input: RecordSwipeInput,
): Promise<ActionResult> {
  const parsed = recordSwipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "スワイプを記録できませんでした。" };
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    return { ok: false, error: "セッションが見つかりません。" };
  }

  try {
    // Undo lalu swipe ulang ke arah lain harus menimpa keputusan lama, bukan
    // menumpuk dua baris yang saling bertentangan.
    await db
      .insert(swipesTable)
      .values({
        sessionId,
        productId: parsed.data.productId,
        direction: parsed.data.direction,
      })
      .onConflictDoUpdate({
        target: [swipesTable.sessionId, swipesTable.productId],
        set: { direction: parsed.data.direction },
      });

    // Feed dan Style DNA sama-sama dibangun dari profil ini.
    revalidatePath("/feed");
    revalidatePath("/style-dna");
    return { ok: true };
  } catch {
    // Tabel swipes mungkin belum di-push. Swipe tetap terasa mulus; yang
    // hilang hanya personalisasinya.
    return { ok: false, error: "スワイプを記録できませんでした。" };
  }
}

export async function superLikeAction(
  input: SuperLikeInput,
): Promise<ActionResult> {
  const parsed = superLikeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "商品が正しくありません。" };
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    return { ok: false, error: "セッションが見つかりません。" };
  }

  try {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, parsed.data.productId));

    if (!product) {
      return { ok: false, error: "商品が見つかりません。" };
    }

    // Sekali per sesi — super like berulang diabaikan diam-diam.
    await db
      .insert(superLikesTable)
      .values({ sessionId, productId: parsed.data.productId })
      .onConflictDoNothing();

    // Feed di-boost oleh koleksi ini, jadi keduanya perlu di-revalidate.
    revalidatePath("/obsessed");
    revalidatePath("/feed");
    return { ok: true };
  } catch {
    // Tabel super_likes mungkin belum di-push — jangan bikin UX gagal total.
    return { ok: false, error: "いま保存できませんでした。" };
  }
}

export async function confirmOrderAction(
  orderId: number,
  input: ConfirmOrderInput,
): Promise<ActionResult> {
  const parsed = confirmOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "入力内容をご確認ください。" };
  }

  const sessionId = await getSessionId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  // Cek kepemilikan: sesi hanya boleh menyentuh order miliknya sendiri.
  if (!existing || existing.sessionId !== sessionId) {
    return { ok: false, error: "注文が見つかりません。" };
  }

  await db
    .update(ordersTable)
    .set({
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: parsed.data.paymentMethod,
      shippingAddress: parsed.data.shippingAddress,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId));

  revalidatePath("/orders");
  return { ok: true };
}

export async function cancelOrderAction(
  orderId: number,
): Promise<ActionResult> {
  const sessionId = await getSessionId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!existing || existing.sessionId !== sessionId) {
    return { ok: false, error: "注文が見つかりません。" };
  }

  if (existing.status !== "cancelled") {
    // Versi Express memakai db.sql yang bukan API Drizzle yang valid,
    // sehingga pengembalian stok melempar error. sql di-import dari drizzle-orm.
    await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} + ${existing.quantity}` })
      .where(eq(productsTable.id, existing.productId));
  }

  await db
    .update(ordersTable)
    .set({
      status: "cancelled",
      paymentStatus: existing.paymentStatus === "paid" ? "refunded" : "unpaid",
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId));

  revalidatePath("/orders");
  return { ok: true };
}
