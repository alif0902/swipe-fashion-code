import "server-only";

import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db, ordersTable, superLikesTable, swipesTable } from "@workspace/db";

import { SESSION_COOKIE } from "./session-cookie";

/**
 * Memindahkan riwayat pengunjung anonim ke akun yang baru saja masuk.
 *
 * Kenapa ini ada: seluruh data pengguna di aplikasi ini berkunci pada kolom
 * `session_id`, yang untuk pengunjung anonim berisi UUID acak dari cookie.
 * Tanpa langkah ini, orang yang sudah swipe belasan barang lalu mendaftar akan
 * menemukan Style DNA-nya kosong kembali — fitur andalan aplikasi ini rusak
 * tepat di momen yang paling diperhatikan.
 *
 * Setelah dipindahkan, `session_id` berisi `user.id`. Itu sebabnya tidak ada
 * satu pun kueri di `lib/data.ts` yang perlu diubah: bentuk datanya sama,
 * hanya nilainya yang sekarang stabil lintas perangkat.
 */
export async function claimAnonymousData(userId: string): Promise<void> {
  const store = await cookies();
  const anonId = store.get(SESSION_COOKIE)?.value;

  // Tidak ada cookie anonim, atau pengguna ini sudah pernah mengklaim dan
  // cookie-nya kebetulan sama dengan id akun. Tidak ada yang perlu dipindah.
  if (!anonId || anonId === userId) return;

  await db.transaction(async (tx) => {
    // `swipes` dan `super_likes` punya unique(session_id, product_id). Kalau
    // akun ini SUDAH punya baris untuk produk yang sama, UPDATE polos akan
    // menabrak constraint dan seluruh transaksi gagal.
    //
    // Aturannya: baris milik akun yang menang, duplikat anonim dibuang. Ini
    // deterministik, dan skenario tabrakannya sendiri jarang — hanya terjadi
    // kalau seseorang swipe anonim di perangkat yang sama sebelum masuk ke
    // akun yang sudah punya riwayat.
    await tx.delete(swipesTable).where(
      and(
        eq(swipesTable.sessionId, anonId),
        inArray(
          swipesTable.productId,
          tx
            .select({ productId: swipesTable.productId })
            .from(swipesTable)
            .where(eq(swipesTable.sessionId, userId)),
        ),
      ),
    );

    await tx.delete(superLikesTable).where(
      and(
        eq(superLikesTable.sessionId, anonId),
        inArray(
          superLikesTable.productId,
          tx
            .select({ productId: superLikesTable.productId })
            .from(superLikesTable)
            .where(eq(superLikesTable.sessionId, userId)),
        ),
      ),
    );

    // Sisanya aman dipindahkan.
    await tx
      .update(swipesTable)
      .set({ sessionId: userId })
      .where(eq(swipesTable.sessionId, anonId));

    await tx
      .update(superLikesTable)
      .set({ sessionId: userId })
      .where(eq(superLikesTable.sessionId, anonId));

    // `orders` tidak punya constraint unik — satu orang boleh memesan produk
    // yang sama berkali-kali — jadi cukup dipindahkan langsung.
    await tx
      .update(ordersTable)
      .set({ sessionId: userId })
      .where(eq(ordersTable.sessionId, anonId));
  });
}
