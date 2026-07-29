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
  sizes: string[];
  colors: string[];
  rating: number | null;
  reviewCount: number;
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

// Kolom numeric Postgres kembali sebagai string lewat node-postgres.
// UI memanggil .toFixed(2) pada harga, jadi konversinya wajib di sini.
function toNumber(value: string | null): number | null {
  return value === null ? null : parseFloat(value);
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
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    rating: toNumber(row.rating),
    reviewCount: row.reviewCount,
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
