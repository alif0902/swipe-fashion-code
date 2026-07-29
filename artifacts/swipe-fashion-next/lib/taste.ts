// Mesin selera SwipeFash.
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

// Profil dianggap penuh keyakinan setelah sekian swipe. Katalog demo berisi
// 12 produk, jadi 10 sudah cukup untuk menyatakan pola.
const CONFIDENCE_FULL_AT = 10;

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

export function buildTasteProfile(signals: TasteSignal[]): TasteProfile {
  const categoryEntries: Array<{ key: string; weight: number }> = [];
  const brandEntries: Array<{ key: string; weight: number }> = [];
  const colorEntries: Array<{ key: string; weight: number }> = [];
  const likedPrices: number[] = [];

  let likedCount = 0;
  let passedCount = 0;

  for (const signal of signals) {
    const weight = DIRECTION_WEIGHT[signal.direction];

    categoryEntries.push({ key: signal.category, weight });
    brandEntries.push({ key: signal.brand, weight });
    for (const color of signal.colors) {
      // Produk dengan banyak warna tidak boleh membanjiri tally, jadi bobotnya
      // dibagi rata antar warna.
      colorEntries.push({ key: color, weight: weight / signal.colors.length });
    }

    if (weight > 0) {
      likedCount += 1;
      if (Number.isFinite(signal.price)) likedPrices.push(signal.price);
    } else {
      passedCount += 1;
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
    totalSwipes: signals.length,
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
