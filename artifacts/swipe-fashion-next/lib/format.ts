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
  gender: "women" | "men";
  material: string | null;
  feel: string | null;
  dimensions: Record<string, string>;
  sizes: string[];
  colors: string[];
  rating: number | null;
  reviewCount: number;
  stock: number;
  isNew: boolean;
  isSale: boolean;
};

export type AppOrder = {
  id: number;
  product: AppProduct | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  totalPrice: number;
  status: Order["status"];
};

export const PLACEHOLDER_IMAGE = "/assets/placeholder.jpg";

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

export function hasCompleteAddress(parts: JapaneseAddress): boolean {
  return Boolean(
    parts.prefecture?.trim() && parts.city?.trim() && parts.address?.trim(),
  );
}

function toNumber(value: string | null): number | null {
  return value === null ? null : parseFloat(value);
}

export function formatPrice(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

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
