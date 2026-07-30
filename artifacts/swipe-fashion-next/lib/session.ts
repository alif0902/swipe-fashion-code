import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

import { auth } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Titik sambung identitas tunggal untuk seluruh aplikasi.
 *
 * Semua data pengguna — `swipes`, `super_likes`, `orders` — berkunci pada satu
 * kolom `session_id`. Modul inilah yang memutuskan apa isi kolom itu:
 *
 *   sudah login  → user.id  (stabil, ikut berpindah perangkat)
 *   belum login  → UUID acak dari cookie (hanya berlaku di perangkat ini)
 *
 * Karena keputusannya terpusat di sini, `lib/data.ts` dan mesin selera tidak
 * perlu tahu apa pun soal akun. Kueri mereka tetap `WHERE session_id = ...`;
 * yang berubah hanya nilai yang masuk ke sana.
 */

/** UUID anonim dari cookie. Diset middleware pada request pertama. */
export async function getAnonId(): Promise<string> {
  const store = await cookies();

  // Kalau tidak ada, request lolos dari matcher middleware — kembalikan string
  // kosong supaya pemanggil menampilkan keadaan kosong, bukan crash.
  return store.get(SESSION_COOKIE)?.value ?? "";
}

/**
 * Pengguna yang sedang login, atau null.
 *
 * Berkat `session.cookieCache` di lib/auth.ts, pemanggilan ini umumnya tidak
 * menyentuh database — penting karena fungsi ini dipakai hampir di setiap
 * halaman sementara databasenya ada di Sydney.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Pemilik data untuk request ini: id akun kalau login, UUID cookie kalau tidak. */
export async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser();
  if (user) return user.id;
  return getAnonId();
}

/**
 * Peran akun, dibaca LANGSUNG dari database.
 *
 * Sengaja tidak memakai `role` dari objek sesi. Sesi disalin ke cookie cache
 * selama beberapa menit — kalau seseorang dicabut hak adminnya, salinan itu
 * masih menyebutnya admin sampai cache-nya kedaluwarsa. Untuk pemeriksaan izin,
 * jeda beberapa menit adalah jeda yang terlalu panjang.
 */
async function readRole(userId: string): Promise<string> {
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId));

  return row?.role ?? "user";
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return (await readRole(user.id)) === "admin";
}

/**
 * Penjaga tunggal untuk seluruh area admin.
 *
 * Dipanggil sebagai baris pertama di SETIAP halaman dan SETIAP Server Action
 * di bawah /admin — bukan sekali di layout. Layout tidak melindungi Server
 * Action, dan Server Action adalah yang benar-benar mengubah data: siapa pun
 * bisa memanggilnya langsung tanpa pernah membuka halamannya.
 *
 * Satu fungsi yang selalu sama, bukan pemeriksaan yang ditulis ulang tiap
 * kali — karena satu tempat yang lupa memeriksa adalah satu lubang.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/account");

  if ((await readRole(user.id)) !== "admin") {
    // Dialihkan, bukan 403. Halaman admin sebaiknya tidak mengonfirmasi
    // keberadaannya kepada orang yang tidak berhak membukanya.
    redirect("/feed");
  }

  return user;
}
