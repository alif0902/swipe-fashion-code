// Mesin selera HITOME.
//
// Modul ini sengaja MURNI — tidak menyentuh database, tidak async, tidak
// membaca cookie. Semua yang dibutuhkan masuk lewat argumen. Konsekuensinya
// bisa diuji unit dengan mudah (lihat taste.test.ts), dan itu penting karena
// logika inilah yang menentukan urutan feed.

import { categoryLabel } from "./format";

export type SwipeDirection = "pass" | "like" | "super";

// Satu keputusan swipe, sudah digabung dengan atribut produknya.
export type TasteSignal = {
  direction: SwipeDirection;
  category: string;
  brand: string;
  colors: string[];
  price: number;
};

export type Affinity = {
  key: string;
  // -1 (sangat ditolak) sampai +1 (sangat disukai).
  //
  // Dinormalisasi terhadap nilai TERKUAT di dimensinya sendiri, jadi yang
  // teratas selalu 1 secara definisi. Berguna untuk panjang bar, TIDAK boleh
  // ditampilkan sebagai angka: dua kategori yang seri di puncak sama-sama
  // menjadi 100, dan angkanya tidak bisa dibandingkan antar dimensi.
  score: number;
};

export type PriceBand = { min: number; max: number; mid: number };

export type TasteProfile = {
  categories: Affinity[];
  brands: Affinity[];
  colors: Affinity[];
  priceBand: PriceBand | null;
  totalSwipes: number;
  likedCount: number;
  passedCount: number;
  // 0..1 — seberapa jauh profil ini boleh dipercaya.
  confidence: number;
};

// Bobot tiap arah swipe. Super like bernilai tiga kali suka biasa karena itu
// gestur sengaja, bukan sekadar "boleh juga". Swipe kiri bernilai negatif —
// inilah sinyal yang sebelumnya terbuang.
const DIRECTION_WEIGHT: Record<SwipeDirection, number> = {
  super: 3,
  like: 1,
  pass: -1,
};

/**
 * Berapa swipe TERAKHIR yang membentuk profil.
 *
 * Sebelumnya seluruh riwayat terhitung, dan bobot swipe pertama sama besar
 * dengan yang barusan. Akibatnya selera terasa membeku: sepuluh swipe lama
 * mengunci feed, dan perubahan minat tidak pernah terlihat.
 *
 * Jendela pendek membuat feed mengikuti apa yang sedang dilihat orang
 * SEKARANG. Konsekuensinya disengaja: pola jangka panjang memang dilupakan.
 * Untuk katalog kecil dan sesi singkat, kelincahan lebih berharga daripada
 * ingatan.
 *
 * PENTING: sinyal harus datang TERBARU DULU. loadSwipeState di lib/data.ts
 * mengurutkannya dengan ORDER BY created_at DESC.
 */
export const RECENT_WINDOW = 5;

// Keyakinan penuh tercapai saat jendelanya terisi. Dulu 10 — angka yang
// mustahil dicapai sekarang, karena tidak akan pernah ada lebih dari
// RECENT_WINDOW sinyal yang terhitung, dan 精度 akan mentok di 50%.
const CONFIDENCE_FULL_AT = RECENT_WINDOW;

// Bobot tiap dimensi saat menilai kandidat produk. Kategori paling menentukan
// (orang membeli "jenis" barang), brand berikutnya, warna sebagai penyelaras,
// harga sebagai penyaring paling lembut.
const DIMENSION_WEIGHT = {
  category: 3,
  brand: 2,
  color: 1.5,
  price: 1,
} as const;

function tally(
  entries: Array<{ key: string; weight: number }>,
): Affinity[] {
  const raw = new Map<string, number>();
  for (const { key, weight } of entries) {
    if (!key) continue;
    raw.set(key, (raw.get(key) ?? 0) + weight);
  }

  if (raw.size === 0) return [];

  // Normalisasi ke -1..1 memakai nilai absolut terbesar, supaya sesi dengan
  // 3 swipe dan sesi dengan 300 swipe menghasilkan skala yang sebanding.
  let peak = 0;
  for (const value of raw.values()) {
    peak = Math.max(peak, Math.abs(value));
  }
  if (peak === 0) return [];

  return [...raw.entries()]
    .map(([key, value]) => ({ key, score: value / peak }))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}

/**
 * @param signals Riwayat swipe, TERBARU DULU. Hanya RECENT_WINDOW pertama
 *   yang dipakai — sisanya diabaikan.
 */
export function buildTasteProfile(allSignals: TasteSignal[]): TasteProfile {
  const signals = allSignals.slice(0, RECENT_WINDOW);

  const categoryEntries: Array<{ key: string; weight: number }> = [];
  const brandEntries: Array<{ key: string; weight: number }> = [];
  const colorEntries: Array<{ key: string; weight: number }> = [];
  const likedPrices: number[] = [];

  // Hitungan seumur hidup, dari SELURUH riwayat — bukan dari jendela.
  //
  // マイページ menampilkan「◯回スワイプ」dan「◯点いいね」. Kalau angka itu
  // ikut dipotong jendela, orang yang sudah menggeser 50 kali akan melihat
  // "5". Selera boleh melupakan masa lalu; hitungannya tidak boleh.
  let likedCount = 0;
  let passedCount = 0;
  for (const signal of allSignals) {
    if (DIRECTION_WEIGHT[signal.direction] > 0) likedCount += 1;
    else passedCount += 1;
  }

  for (const signal of signals) {
    const weight = DIRECTION_WEIGHT[signal.direction];

    categoryEntries.push({ key: signal.category, weight });
    brandEntries.push({ key: signal.brand, weight });
    for (const color of signal.colors) {
      // Produk dengan banyak warna tidak boleh membanjiri tally, jadi bobotnya
      // dibagi rata antar warna.
      colorEntries.push({ key: color, weight: weight / signal.colors.length });
    }

    // Rentang harga ikut jendela: anggaran yang relevan adalah anggaran
    // sekarang, bukan rata-rata sepanjang masa.
    if (weight > 0 && Number.isFinite(signal.price)) {
      likedPrices.push(signal.price);
    }
  }

  // Rentang harga hanya dibangun dari yang DISUKAI. Harga barang yang ditolak
  // tidak memberi tahu apa pun soal anggaran — bisa jadi ditolak karena
  // modelnya, bukan harganya.
  let priceBand: PriceBand | null = null;
  if (likedPrices.length > 0) {
    const min = Math.min(...likedPrices);
    const max = Math.max(...likedPrices);
    const mid = likedPrices.reduce((sum, p) => sum + p, 0) / likedPrices.length;
    priceBand = { min, max, mid };
  }

  return {
    categories: tally(categoryEntries),
    brands: tally(brandEntries),
    colors: tally(colorEntries),
    priceBand,
    // Seumur hidup, bukan jendela — dipakai マイページ.
    totalSwipes: allSignals.length,
    likedCount,
    passedCount,
    confidence: Math.min(1, signals.length / CONFIDENCE_FULL_AT),
  };
}

function affinityOf(list: Affinity[], key: string): number {
  return list.find((a) => a.key === key)?.score ?? 0;
}

// Produk apa pun yang punya atribut yang bisa dinilai. Sengaja longgar supaya
// modul ini tidak bergantung pada tipe AppProduct.
export type ScorableProduct = {
  category: string;
  brand: string;
  colors: string[];
  price: number;
};

export function scoreProduct(
  profile: TasteProfile,
  product: ScorableProduct,
): number {
  let score = 0;

  score += DIMENSION_WEIGHT.category * affinityOf(profile.categories, product.category);
  score += DIMENSION_WEIGHT.brand * affinityOf(profile.brands, product.brand);

  if (product.colors.length > 0) {
    const colorAffinity =
      product.colors.reduce((sum, c) => sum + affinityOf(profile.colors, c), 0) /
      product.colors.length;
    score += DIMENSION_WEIGHT.color * colorAffinity;
  }

  // Kedekatan harga ke titik tengah anggaran yang teramati. Dinormalisasi oleh
  // lebar rentang supaya selera "semua serba murah" dan "semua serba mahal"
  // sama-sama tertangani. Rentang selebar 0 (baru satu produk disukai) diberi
  // toleransi minimum agar tidak membagi dengan nol.
  if (profile.priceBand) {
    const { min, max, mid } = profile.priceBand;
    const spread = Math.max(max - min, mid * 0.5, 1);
    const distance = Math.abs(product.price - mid) / spread;
    score += DIMENSION_WEIGHT.price * (1 - Math.min(distance, 2));
  }

  return score;
}

// Urutkan kandidat menurut kecocokan dengan profil. Array.prototype.sort di
// JS sudah stabil, jadi produk dengan skor sama mempertahankan urutan masuk —
// membuat feed deterministik dan bisa diuji.
export function rankProducts<T extends ScorableProduct>(
  profile: TasteProfile,
  products: T[],
): T[] {
  if (profile.totalSwipes === 0) return [...products];

  return [...products].sort(
    (a, b) => scoreProduct(profile, b) - scoreProduct(profile, a),
  );
}

// Ringkasan sependek mungkin untuk ditempel di UI, mis.
// 「Emeraldのワンピース（MAISON NOIR）」. Mengembalikan null kalau belum ada
// cukup sinyal.
//
// Susunannya mengikuti tata bahasa Jepang, bukan menerjemahkan pola Inggris
// kata per kata: pewatas mendahului kata benda, dan nama brand masuk kurung
// karena ditulis huruf Latin di tengah kalimat Jepang.
export function describeTaste(profile: TasteProfile): string | null {
  if (profile.likedCount === 0) return null;

  const topCategory = profile.categories.find((a) => a.score > 0)?.key;
  const topColor = profile.colors.find((a) => a.score > 0)?.key;
  const topBrand = profile.brands.find((a) => a.score > 0)?.key;

  if (!topCategory && !topColor && !topBrand) return null;

  const noun = topCategory ? categoryLabel(topCategory) : "アイテム";
  const base = topColor ? `${topColor}の${noun}` : noun;

  return topBrand ? `${base}（${topBrand}）` : base;
}

/**
 * Menjelaskan KENAPA sebuah produk berada di posisinya pada feed.
 *
 * Ini yang menyambungkan スタイルDNA dengan feed secara terlihat. Keduanya
 * sudah memakai profil yang sama sejak awal — tapi tanpa penjelasan di layar,
 * tidak ada cara bagi siapa pun untuk mengetahuinya. Rekomendasi yang tidak
 * bisa dijelaskan tidak bisa dibedakan dari urutan acak.
 *
 * Caranya: hitung ulang sumbangan tiap dimensi terhadap skor produk, lalu
 * sebutkan yang paling besar. Angkanya tidak ditampilkan — yang berguna bagi
 * pembaca adalah alasannya, bukan bobotnya.
 *
 * Murni, seperti sisa modul ini, jadi bisa dipanggil dari server maupun klien
 * dan tetap bisa diuji unit.
 */
export function explainRanking(
  profile: TasteProfile,
  product: ScorableProduct,
): string | null {
  // Belum ada satu pun swipe: tidak ada yang bisa dijelaskan, dan mengarang
  // alasan justru merusak kepercayaan pada seluruh fiturnya.
  if (profile.totalSwipes === 0) return null;

  const categoryScore =
    DIMENSION_WEIGHT.category * affinityOf(profile.categories, product.category);
  const brandScore =
    DIMENSION_WEIGHT.brand * affinityOf(profile.brands, product.brand);

  const colorAffinity =
    product.colors.length > 0
      ? product.colors.reduce((sum, c) => sum + affinityOf(profile.colors, c), 0) /
        product.colors.length
      : 0;
  const colorScore = DIMENSION_WEIGHT.color * colorAffinity;

  let priceScore = 0;
  if (profile.priceBand) {
    const { min, max, mid } = profile.priceBand;
    const spread = Math.max(max - min, mid * 0.5, 1);
    const distance = Math.abs(product.price - mid) / spread;
    priceScore = DIMENSION_WEIGHT.price * (1 - Math.min(distance, 2));
  }

  const reasons: { score: number; text: string }[] = [
    { score: categoryScore, text: `${categoryLabel(product.category)}をよく選ぶから` },
    { score: brandScore, text: `${product.brand}が好みだから` },
    { score: colorScore, text: `${product.colors[0] ?? ""}系が好みだから` },
    { score: priceScore, text: "好みの価格帯だから" },
  ];

  const best = reasons.reduce((a, b) => (b.score > a.score ? b : a));

  // Sumbangan negatif atau nol berarti produk ini justru MELAWAN selera yang
  // terekam. Menyebutnya "karena kamu suka" akan berbohong; lebih jujur
  // menyatakan ia sengaja ditaruh di belakang.
  if (best.score <= 0) return "好みからは少し外れています";

  return best.text;
}
