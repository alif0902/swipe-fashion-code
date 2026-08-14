/**
 * Filter feed: 性別 dan カテゴリー.
 *
 * KENAPA DI COOKIE, BUKAN DI QUERY STRING seperti 探す. Feed dicapai lewat
 * bilah navigasi, dan tautannya `/feed` polos — dengan query string, filter
 * hilang setiap kali orang pindah tab dan kembali. Cookie bisa dibaca di
 * server, jadi halaman yang dirender sudah benar sejak byte pertama dan tidak
 * ada kedipan "semua produk" sebelum filternya sempat berlaku.
 *
 * Modul ini TIDAK menyentuh database maupun `next/headers`. Ia hanya menerjemah
 * string ke objek dan sebaliknya, jadi bisa diuji tanpa harness apa pun —
 * sama seperti lib/taste.ts dan lib/payment.ts.
 *
 * 並び替え sengaja tidak ada di sini. Urutan feed milik mesin selera; menaruhnya
 * sebagai salah satu pilihan urutan akan membacanya sebagai "salah satu cara
 * mengurutkan", padahal ia cara kerja halamannya.
 */

export type FeedFilter = {
  gender?: "women" | "men";
  category?: string;
};

// Garis bawah, bukan titik dua. `:` bukan karakter sah untuk NAMA cookie
// menurut RFC 6265 (ia pemisah, bukan bagian token), dan sebagian serializer
// menolaknya mentah-mentah. Penanda di localStorage boleh memakai `hitome:` —
// di sana tidak ada aturannya — tapi cookie mengikuti gaya yang sudah dipakai
// SESSION_COOKIE.
export const FEED_FILTER_COOKIE = "hitome_feed_filter";

// Bentuk slug kategori: huruf kecil, boleh angka dan tanda hubung di belakang.
// Daftar kategori yang sah ada di database, dan modul ini sengaja tidak
// mengetahuinya — memeriksa BENTUKnya sudah cukup untuk menahan isi cookie yang
// disunting orang. Slug yang bentuknya sah tapi tidak ada di katalog hanya
// menghasilkan nol produk, dan keadaan kosong berfilter sudah punya jalan
// keluarnya sendiri di layar.
const CATEGORY_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

function readGender(value: string | null): FeedFilter["gender"] {
  return value === "women" || value === "men" ? value : undefined;
}

function readCategory(value: string | null): string | undefined {
  return value && CATEGORY_PATTERN.test(value) ? value : undefined;
}

/**
 * Membaca nilai cookie. Apa pun yang tidak dikenal DIBUANG, bukan diteruskan:
 * isi cookie bisa disunting lewat devtools, dan nilainya berakhir di klausa
 * WHERE.
 */
export function parseFeedFilter(raw: string | undefined): FeedFilter {
  if (!raw) return {};

  // URLSearchParams, bukan pemisahan manual: ia sudah menangani encoding,
  // kunci ganda, dan potongan yang tidak berbentuk pasangan kunci-nilai tanpa
  // melempar.
  const params = new URLSearchParams(raw);

  const gender = readGender(params.get("gender"));
  const category = readCategory(params.get("category"));

  // Kunci yang undefined sengaja tidak ditulis, supaya `{}` benar-benar berarti
  // "tidak ada filter" dan bisa dibandingkan langsung di tes.
  return {
    ...(gender ? { gender } : {}),
    ...(category ? { category } : {}),
  };
}

/**
 * Kebalikannya. Nilai yang tidak sah ikut dibuang di sini juga, jadi Server
 * Action cukup melakukan serialize lalu parse untuk membersihkan apa pun yang
 * dikirim klien.
 */
export function serializeFeedFilter(filter: FeedFilter): string {
  const params = new URLSearchParams();

  const gender = readGender(filter.gender ?? null);
  const category = readCategory(filter.category ?? null);

  if (gender) params.set("gender", gender);
  if (category) params.set("category", category);

  return params.toString();
}

/** Angka di lencana tombol 絞り込む. */
export function countActiveFeedFilters(filter: FeedFilter): number {
  return (filter.gender ? 1 : 0) + (filter.category ? 1 : 0);
}
