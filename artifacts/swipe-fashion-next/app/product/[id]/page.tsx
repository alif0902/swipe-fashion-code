import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info, Star } from "lucide-react";

import { ProductDetailActions } from "@/components/product-detail-actions";
import { getProduct } from "@/lib/data";

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
    return { title: "Product not found | SwipeFash" };
  }

  const title = `${product.name} by ${product.brand} | SwipeFash`;

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

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative max-w-md mx-auto">
      <Link
        href="/lookbook"
        className="absolute top-safe-8 left-4 z-50 rounded-full w-10 h-10 bg-background/50 backdrop-blur-md border-0 text-foreground flex items-center justify-center hover:bg-background/70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </Link>

      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        <div className="relative w-full h-[65vh] bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/0 to-transparent pointer-events-none" />
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-card border border-card-border p-6 rounded-3xl shadow-xl space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                {product.brand}
              </p>
              <h1 className="font-serif text-3xl leading-tight mb-3">
                {product.name}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-2xl">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-muted-foreground line-through text-sm">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium text-foreground">
                      {product.rating}
                    </span>
                    <span className="text-muted-foreground">
                      ({product.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Details
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                <Info className="w-4 h-4 shrink-0" />
                <p>
                  Free standard shipping on orders over $200. Free returns
                  within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductDetailActions product={product} />
    </div>
  );
}
