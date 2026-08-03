"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  productsTable,
  superLikesTable,
  swipesTable,
  userTable,
} from "@workspace/db";

import { getCurrentUser, getOwnerId } from "@/lib/session";
import { putDataUrl } from "@/lib/storage";
import {
  confirmOrderSchema,
  createOrderSchema,
  profileSchema,
  recordSwipeSchema,
  superLikeSchema,
  type ConfirmOrderInput,
  type CreateOrderInput,
  type ProfileInput,
  type RecordSwipeInput,
  type SuperLikeInput,
} from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Penanda bahwa stok keburu diambil request lain di tengah transaksi.
 *
 * Dibuat sebagai kelas sendiri, bukan string atau null, supaya `catch` di
 * createOrderAction bisa membedakannya dari kegagalan database sungguhan.
 * Menelan semua error di sana akan menyembunyikan koneksi putus sebagai
 * "stok habis".
 */
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

  // Ukuran dan warna divalidasi terhadap produknya, bukan sekadar "string tidak
  // kosong". Tanpa ini pesanan untuk ukuran yang tidak diproduksi bisa masuk ke
  // database dan baru ketahuan saat barangnya hendak dikirim.
  if (!product.sizes.includes(selectedSize)) {
    return { ok: false, error: "選択されたサイズは取り扱いがありません。" };
  }
  if (!product.colors.includes(selectedColor)) {
    return { ok: false, error: "選択されたカラーは取り扱いがありません。" };
  }

  // Harga diambil dari baris produk, TIDAK PERNAH dari input klien.
  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  // Stok dipotong dan pesanan dibuat dalam SATU transaksi.
  //
  // Versi sebelumnya membaca stok, memeriksanya, lalu menulis nilai mutlak
  // `product.stock - quantity`. Dua request bersamaan sama-sama membaca stock=1,
  // sama-sama lolos pemeriksaan, lalu sama-sama menulis 0 — satu barang terjual
  // dua kali. Pembacaan di atas kini hanya untuk harga dan validasi varian;
  // yang menentukan boleh-tidaknya adalah UPDATE di bawah.
  //
  // Syarat `stock >= quantity` sengaja ikut ke dalam WHERE, bukan diperiksa
  // lebih dulu di JavaScript. Postgres mengunci baris saat UPDATE, jadi request
  // kedua menunggu, membaca nilai yang sudah diperbarui, tidak cocok lagi, dan
  // `returning` kembali kosong.
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

      // Tidak ada baris yang cocok = stok keburu habis diambil request lain.
      // Melempar di dalam callback membatalkan seluruh transaksi, jadi pesanan
      // tidak pernah tercatat.
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

  const sessionId = await getOwnerId();
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

    // HANYA Style DNA. Feed SENGAJA tidak di-revalidate.
    //
    // Merevalidasi /feed di sini membuat server mengirim daftar produk baru
    // ke tengah sesi swipe yang sedang berjalan — barang yang baru diputuskan
    // hilang dari daftar dan sisanya diurutkan ulang, sementara indeks kartu
    // di klien tetap. Kartu di layar lalu berganti sendiri.
    //
    // Urutan feed memang ditentukan sekali saat halaman dimuat. Itu bukan
    // keterbatasan: tumpukan kartu yang menyusun ulang dirinya di tengah
    // permainan justru terasa rusak.
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

    // Sekali per sesi — super like berulang diabaikan diam-diam.
    await db
      .insert(superLikesTable)
      .values({ sessionId, productId: parsed.data.productId })
      .onConflictDoNothing();

    // Sama seperti recordSwipeAction: /feed tidak ikut di-revalidate agar
    // tumpukan kartu yang sedang berjalan tidak tersusun ulang di tengah sesi.
    revalidatePath("/obsessed");
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

  const sessionId = await getOwnerId();

  // Kepemilikan DAN status sama-sama diperiksa di dalam WHERE.
  //
  // Versi sebelumnya hanya memeriksa kepemilikan, lalu menulis tanpa syarat.
  // Akibatnya pesanan yang sudah dibatalkan — yang stoknya sudah dikembalikan —
  // masih bisa dikonfirmasi ulang menjadi confirmed/paid, dan barangnya lolos
  // tanpa stok terpotong. Menaruh syaratnya di WHERE sekaligus membuat
  // pemanggilan ganda yang bersamaan hanya berhasil sekali.
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
    // Pesan yang sama untuk "bukan milikmu" dan "statusnya sudah bukan
    // pending" — membedakannya akan memberi tahu orang asing bahwa suatu id
    // pesanan itu ada.
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

  // Pembatalan dan pengembalian stok dijadikan satu transaksi.
  //
  // Versi sebelumnya memeriksa `existing.status !== "cancelled"` dari hasil
  // SELECT di atas, lalu mengembalikan stok. Increment-nya memang sudah atomik,
  // tapi penjaganya tidak: dua pembatalan bersamaan atas pesanan yang sama
  // sama-sama lolos pemeriksaan dan stok bertambah dua kali lipat.
  //
  // Sekarang syarat "belum dibatalkan" ikut ke dalam WHERE. Hanya pemanggilan
  // yang benar-benar MENGUBAH barisnya yang berhak mengembalikan stok — yang
  // kedua mendapat `returning` kosong dan tidak menyentuh apa pun.
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

  // Sudah dibatalkan sebelumnya bukan kegagalan — hasil akhirnya sama dengan
  // yang diminta pengguna, jadi tidak perlu memunculkan pesan error.
  if (restored) revalidatePath("/orders");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Profil akun
// ---------------------------------------------------------------------------

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

  // Kolom dikosongkan jadi NULL, bukan string kosong: pengecekan "sudah punya
  // alamat?" di checkout jadi cukup satu bentuk, tidak dua.
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

  // Validasi format dan ukuran ada di dalam putDataUrl — satu tempat, dipakai
  // foto profil maupun foto produk.
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

/**
 * Mengembalikan foto profil ke avatar bawaan.
 *
 * Sebelumnya foto hanya bisa DIGANTI — sekali seseorang mengunggah, tidak ada
 * jalan kembali. Menyetel `image` ke null membuat komponen avatar jatuh ke
 * inisial namanya, sama seperti akun yang belum pernah mengunggah apa pun.
 *
 * Berkasnya sendiri sengaja TIDAK dihapus dari Vercel Blob. Menghapusnya butuh
 * pelacakan blob mana milik siapa, dan satu kesalahan di sana akan menghapus
 * foto orang lain. Blob yatim jauh lebih murah daripada risiko itu — foto
 * profil berukuran 256px, dan kuota gratisnya 1 GB.
 */
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

/**
 * Menghapus pesanan yang sudah dibatalkan dari daftar.
 *
 * Hanya berlaku untuk status `cancelled`, dan itu batasan yang disengaja:
 * pesanan aktif harus dibatalkan lebih dulu supaya stoknya dikembalikan.
 * Kalau baris aktif boleh langsung dihapus, stok yang sudah dipotong akan
 * hilang tanpa pernah dikembalikan — dan tidak ada jejak untuk melacaknya.
 *
 * Baris pesanan tidak dirujuk tabel lain, jadi penghapusan di sini aman —
 * berbeda dengan produk, yang justru diarsipkan karena banyak yang menunjuk
 * ke sana.
 */
export async function deleteOrderAction(
  orderId: number,
): Promise<ActionResult> {
  const sessionId = await getOwnerId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  // Cek kepemilikan sama seperti aksi pesanan lain: sesi hanya boleh
  // menyentuh barisnya sendiri.
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

/**
 * Membatalkan いいね yang baru saja ditekan.
 *
 * Menghapus DUA hal, bukan satu: baris di `super_likes` dan baris keputusan di
 * `swipes`. Kalau swipe-nya dibiarkan, produk itu tetap dianggap "sudah
 * diputuskan" dan tidak akan pernah muncul lagi di feed — jadi pembatalannya
 * hanya setengah jalan, dan barangnya lenyap tanpa masuk ke mana pun.
 *
 * Mesin selera juga ikut bersih: sinyal +3 dari super like itu hilang, seolah
 * ketukan tadi memang tidak pernah terjadi.
 */
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
    revalidatePath("/style-dna");
    return { ok: true };
  } catch {
    return { ok: false, error: "取り消せませんでした。" };
  }
}
