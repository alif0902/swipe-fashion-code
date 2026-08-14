"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  reviewsTable,
  superLikesTable,
  swipesTable,
  userTable,
} from "@workspace/db";

import { listReviews, type AppReview } from "@/lib/data";
import {
  FEED_FILTER_COOKIE,
  serializeFeedFilter,
  type FeedFilter,
} from "@/lib/feed-filter";
import { getCurrentUser, getOwnerId } from "@/lib/session";
import { putDataUrl } from "@/lib/storage";
import {
  confirmOrderSchema,
  createOrderSchema,
  profileSchema,
  recordSwipeSchema,
  reviewSchema,
  superLikeSchema,
  type ConfirmOrderInput,
  type CreateOrderInput,
  type ProfileInput,
  type RecordSwipeInput,
  type ReviewInput,
  type SuperLikeInput,
} from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

class OutOfStockError extends Error {
  constructor() {
    super("out of stock");
    this.name = "OutOfStockError";
  }
}

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "注文内容が正しくありません。" };
  }

  const sessionId = await getOwnerId();
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

  if (!product.sizes.includes(selectedSize)) {
    return { ok: false, error: "選択されたサイズは取り扱いがありません。" };
  }
  if (!product.colors.includes(selectedColor)) {
    return { ok: false, error: "選択されたカラーは取り扱いがありません。" };
  }

  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  try {
    await db.transaction(async (tx) => {
      const claimed = await tx
        .update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${quantity}` })
        .where(
          and(
            eq(productsTable.id, productId),
            gte(productsTable.stock, quantity),
          ),
        )
        .returning({ id: productsTable.id });

      if (claimed.length === 0) throw new OutOfStockError();

      await tx.insert(ordersTable).values({
        sessionId,
        productId,
        selectedSize,
        selectedColor,
        quantity,
        totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
      });
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return { ok: false, error: "在庫が足りません。" };
    }
    throw error;
  }

  revalidatePath("/orders");
  return { ok: true };
}

export async function listReviewsAction(
  productId: number,
): Promise<AppReview[]> {
  const sessionId = await getOwnerId();
  return listReviews(productId, sessionId);
}

export async function createReviewAction(
  input: ReviewInput,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const sessionId = await getOwnerId();
  const { productId, rating, authorName, body } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [product] = await tx
        .select({
          rating: productsTable.rating,
          reviewCount: productsTable.reviewCount,
        })
        .from(productsTable)
        .where(eq(productsTable.id, productId));

      if (!product) throw new Error("product not found");

      await tx.insert(reviewsTable).values({
        productId,
        sessionId: sessionId || null,
        authorName,
        rating,
        body,
      });

      const oldCount = product.reviewCount;
      const oldRating = product.rating ? parseFloat(product.rating) : 0;
      const nextCount = oldCount + 1;
      const nextRating = (oldRating * oldCount + rating) / nextCount;

      await tx
        .update(productsTable)
        .set({
          rating: nextRating.toFixed(2),
          reviewCount: nextCount,
        })
        .where(eq(productsTable.id, productId));
    });
  } catch {
    return { ok: false, error: "レビューを投稿できませんでした。" };
  }

  revalidatePath(`/product/${productId}`);
  revalidatePath("/feed");
  return { ok: true };
}

export async function recordSwipeAction(
  input: RecordSwipeInput,
): Promise<ActionResult> {
  const parsed = recordSwipeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "スワイプを記録できませんでした。" };
  }

  const sessionId = await getOwnerId();
  if (!sessionId) {
    return { ok: false, error: "セッションが見つかりません。" };
  }

  try {
    await db
      .insert(swipesTable)
      .values({
        sessionId,
        productId: parsed.data.productId,
        direction: parsed.data.direction,
      })
      .onConflictDoUpdate({
        target: [swipesTable.sessionId, swipesTable.productId],
        set: { direction: parsed.data.direction, createdAt: new Date() },
      });

    return { ok: true };
  } catch {
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

  const sessionId = await getOwnerId();
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

    await db
      .insert(superLikesTable)
      .values({ sessionId, productId: parsed.data.productId })
      .onConflictDoNothing();

    revalidatePath("/obsessed");
    return { ok: true };
  } catch {
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

  const sessionId = await getOwnerId();

  const confirmed = await db
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
    .where(
      and(
        eq(ordersTable.id, orderId),
        eq(ordersTable.sessionId, sessionId),
        eq(ordersTable.status, "pending"),
      ),
    )
    .returning({ id: ordersTable.id });

  if (confirmed.length === 0) {
    return { ok: false, error: "注文が見つかりません。" };
  }

  revalidatePath("/orders");
  return { ok: true };
}

export async function cancelOrderAction(
  orderId: number,
): Promise<ActionResult> {
  const sessionId = await getOwnerId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!existing || existing.sessionId !== sessionId) {
    return { ok: false, error: "注文が見つかりません。" };
  }

  const restored = await db.transaction(async (tx) => {
    const cancelled = await tx
      .update(ordersTable)
      .set({
        status: "cancelled",
        paymentStatus: existing.paymentStatus === "paid" ? "refunded" : "unpaid",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.sessionId, sessionId),
          ne(ordersTable.status, "cancelled"),
        ),
      )
      .returning({ quantity: ordersTable.quantity });

    if (cancelled.length === 0) return false;

    await tx
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} + ${cancelled[0].quantity}` })
      .where(eq(productsTable.id, existing.productId));

    return true;
  });

  if (restored) revalidatePath("/orders");
  return { ok: true };
}

export async function updateProfileAction(
  input: ProfileInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "ログインが必要です。" };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { name, postalCode, prefecture, city, address, building } = parsed.data;

  const orNull = (value: string | undefined) => value?.trim() || null;

  await db
    .update(userTable)
    .set({
      name,
      postalCode: orNull(postalCode),
      prefecture: orNull(prefecture),
      city: orNull(city),
      address: orNull(address),
      building: orNull(building),
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, user.id));

  revalidatePath("/account");
  revalidatePath("/orders");
  return { ok: true };
}

export async function updateAvatarAction(
  dataUrl: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "ログインが必要です。" };
  }

  const stored = await putDataUrl(dataUrl, "avatars");
  if (!stored.ok) {
    return { ok: false, error: stored.error };
  }

  await db
    .update(userTable)
    .set({ image: stored.url, updatedAt: new Date() })
    .where(eq(userTable.id, user.id));

  revalidatePath("/account");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "ログインが必要です。" };
  }

  await db
    .update(userTable)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(userTable.id, user.id));

  revalidatePath("/account");
  return { ok: true };
}

export async function deleteOrderAction(
  orderId: number,
): Promise<ActionResult> {
  const sessionId = await getOwnerId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!existing || existing.sessionId !== sessionId) {
    return { ok: false, error: "注文が見つかりません。" };
  }

  if (existing.status !== "cancelled") {
    return { ok: false, error: "キャンセルした注文のみ削除できます。" };
  }

  await db.delete(ordersTable).where(eq(ordersTable.id, orderId));

  revalidatePath("/orders");
  return { ok: true };
}

export async function undoSuperLikeAction(
  productId: number,
): Promise<ActionResult> {
  const sessionId = await getOwnerId();
  if (!sessionId) {
    return { ok: false, error: "セッションが見つかりません。" };
  }

  try {
    await db
      .delete(superLikesTable)
      .where(
        and(
          eq(superLikesTable.sessionId, sessionId),
          eq(superLikesTable.productId, productId),
        ),
      );

    await db
      .delete(swipesTable)
      .where(
        and(
          eq(swipesTable.sessionId, sessionId),
          eq(swipesTable.productId, productId),
        ),
      );

    revalidatePath("/obsessed");
    return { ok: true };
  } catch {
    return { ok: false, error: "取り消せませんでした。" };
  }
}

export async function setFeedFilterAction(
  input: FeedFilter,
): Promise<ActionResult> {
  const value = serializeFeedFilter(input);
  const store = await cookies();

  if (value === "") {
    store.delete(FEED_FILTER_COOKIE);
  } else {
    store.set(FEED_FILTER_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return { ok: true };
}
