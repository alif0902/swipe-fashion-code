import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProduct } from "@/lib/data";
import { PhoneFrame } from "@/components/layout";
import { ProductDetailFeed } from "@/components/product-detail-feed";

async function loadProduct(rawId: string) {
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) return null;
  return getProduct(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    return { title: "商品が見つかりません｜HITOME" };
  }

  const title = `${product.name} by ${product.brand} | HITOME`;

  return {
    title,
    description: product.description,
    openGraph: {
      title,
      description: product.description,
      type: "website",
      images: [{ url: product.imageUrl, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) notFound();

  // Tampilannya sengaja sama persis dengan kartu di feed — ProductDetailFeed
  // memakai ulang ProductCard, bukan meniru tata letaknya.
  return (
    <PhoneFrame>
      <ProductDetailFeed product={product} />
    </PhoneFrame>
  );
}
