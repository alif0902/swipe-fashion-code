import type { Order, Product } from "@workspace/db";

export type AppProduct = {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  description: string;
  imageUrl: string;
  images: string[];
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number | null;
  reviewCount: number;
  isNew: boolean;
  isSale: boolean;
  createdAt: Date;
};

export type AppOrder = {
  id: number;
  sessionId: string;
  productId: number;
  product: AppProduct | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  totalPrice: number;
  status: Order["status"];
  paymentMethod: string | null;
  paymentStatus: Order["paymentStatus"];
  shippingAddress: string | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    images: row.images ?? [],
    category: row.category,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: row.stock,
    rating: toNumber(row.rating),
    reviewCount: row.reviewCount,
    isNew: row.isNew,
    isSale: row.isSale,
    createdAt: row.createdAt,
  };
}

export function formatOrder(row: Order, product: Product | null): AppOrder {
  return {
    id: row.id,
    sessionId: row.sessionId,
    productId: row.productId,
    product: product ? formatProduct(product) : null,
    selectedSize: row.selectedSize,
    selectedColor: row.selectedColor,
    quantity: row.quantity,
    totalPrice: parseFloat(row.totalPrice),
    status: row.status,
    paymentMethod: row.paymentMethod ?? null,
    paymentStatus: row.paymentStatus,
    shippingAddress: row.shippingAddress ?? null,
    customerName: row.customerName ?? null,
    customerEmail: row.customerEmail ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
