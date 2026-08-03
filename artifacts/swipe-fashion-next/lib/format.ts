import type { Order, Product } from "@workspace/db";

// Hanya field yang dirender UI. Server Actions bekerja pada baris database
// mentah, jadi kolom seperti stock tidak perlu ikut menyeberang ke klien.
export type AppProduct = {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  description: string;
  imageUrl: string;
  images: string[];
  // Dipakai mesin selera (lib/taste.ts) untuk mengukur kecocokan kategori.
  category: string;
  gender: "women" | "men";
  // Komposisi bahan dan ukuran detail, dirender di blok 基本情報 kartu feed.
  material: string | null;
  // Satu kalimat soal rasa memakainya. Dirender di gelembung caption kartu
  // feed; material dipakai sebagai cadangan kalau ini kosong.
  feel: string | null;
  dimensions: Record<string, string>;
  sizes: string[];
  colors: string[];
  rating: number | null;
  reviewCount: number;
  // Ditampilkan sebagai 「残り○点」 di blok 基本情報.
  stock: number;
  isNew: boolean;
  isSale: boolean;
};

// Hanya field yang benar-benar dirender halaman orders. Objek ini menyeberang
// ke Client Component, jadi kolom seperti sessionId dan data pembeli sengaja
// tidak dibawa — tidak ada yang memakainya di sana.
export type AppOrder = {
  id: number;
  product: AppProduct | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  totalPrice: number;
  status: Order["status"];
};

/**
 * Gambar pengganti ketika sebuah baris tidak punya foto yang bisa dipakai.
 *
 * Bukan kemewahan: `next/image` MELEMPAR error kalau `src` berupa string
 * kosong, jadi pola `src={mungkinKosong ?? ""}` menjatuhkan seluruh halaman —
 * bukan sekadar menampilkan gambar rusak. Riwayat pesanan adalah tempat
 * paling mungkin hal itu terjadi, karena pesanan bertahan lebih lama daripada
 * produk yang dibelinya.
 */
export const PLACEHOLDER_IMAGE = "/assets/placeholder.jpg";

/** Mengembalikan src yang selalu bisa dirender. */
export function safeImage(src: string | null | undefined): string {
  return src && src.trim() !== "" ? src : PLACEHOLDER_IMAGE;
}

export type JapaneseAddress = {
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  address?: string | null;
  building?: string | null;
};

/**
 * Menyusun alamat Jepang jadi satu baris untuk ditampilkan dan dikirim.
 *
 * Urutannya dari besar ke kecil — prefektur, kota, banchi, gedung — kebalikan
 * dari alamat Barat. Menuliskannya terbalik membuat alamat terbaca janggal
 * bagi pembaca Jepang, dan bisa menyulitkan pemilahan di kurir.
 *
 * Bagian yang kosong dilewati, jadi alamat yang belum lengkap tetap terbaca
 * masuk akal alih-alih menyisakan spasi dan tanda baca menggantung.
 *
 * Murni dan tanpa efek samping, jadi bisa diuji unit.
 */
export function formatAddress(parts: JapaneseAddress): string {
  const postal = parts.postalCode?.trim();

  return [
    postal ? `〒${postal}` : "",
    parts.prefecture?.trim() ?? "",
    parts.city?.trim() ?? "",
    parts.address?.trim() ?? "",
    parts.building?.trim() ?? "",
  ]
    .filter((segment) => segment !== "")
    .join(" ");
}

/** Alamat dianggap terisi hanya bila tiga bagian wajibnya ada. */
export function hasCompleteAddress(parts: JapaneseAddress): boolean {
  return Boolean(
    parts.prefecture?.trim() && parts.city?.trim() && parts.address?.trim(),
  );
}

// Kolom numeric Postgres kembali sebagai string lewat node-postgres.
// UI memperlakukan harga sebagai angka, jadi konversinya wajib di sini.
function toNumber(value: string | null): number | null {
  return value === null ? null : parseFloat(value);
}

// Harga dalam yen. Jepang tidak memakai pecahan sen, jadi desimal dibuang dan
// pemisah ribuan dipakai — ¥51,000, bukan ¥51000.00.
//
// Sengaja tidak memakai Intl.NumberFormat dengan style "currency": formatnya
// menghasilkan "￥" lebar penuh yang merusak perataan angka di kartu produk.
// Simbol ditulis manual, pemisah ribuan tetap dari toLocaleString.
export function formatPrice(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

// Nama kategori untuk ditampilkan. Kolom category di database berisi slug
// bahasa Inggris yang juga dipakai sebagai filter URL, jadi tidak diterjemahkan
// di sana — pemetaannya dilakukan di sisi tampilan seperti ini.
const CATEGORY_LABELS: Record<string, string> = {
  tops: "トップス",
  bottoms: "ボトムス",
  outerwear: "アウター",
  dresses: "ワンピース",
};

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}

export function formatProduct(row: Product): AppProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: parseFloat(row.price),
    originalPrice: toNumber(row.originalPrice),
    description: row.description,
    imageUrl: row.imageUrl,
    // Kalau kolom images terisi, pakai itu; kalau tidak, jatuh ke satu foto
    // utama supaya carousel tetap tampil dengan satu slide.
    images:
      row.images && row.images.length > 0 ? row.images : [row.imageUrl],
    category: row.category,
    gender: row.gender,
    material: row.material,
    feel: row.feel,
    dimensions: row.dimensions ?? {},
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    rating: toNumber(row.rating),
    reviewCount: row.reviewCount,
    stock: row.stock,
    isNew: row.isNew,
    isSale: row.isSale,
  };
}

export function formatOrder(row: Order, product: Product | null): AppOrder {
  return {
    id: row.id,
    product: product ? formatProduct(product) : null,
    selectedSize: row.selectedSize,
    selectedColor: row.selectedColor,
    quantity: row.quantity,
    totalPrice: parseFloat(row.totalPrice),
    status: row.status,
  };
}
