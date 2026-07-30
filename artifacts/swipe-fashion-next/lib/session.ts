import "server-only";

import { cookies, headers } from "next/headers";

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
