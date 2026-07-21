import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppLayout } from "@/components/layout";
import { listCategories, listProducts } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lookbook | SwipeFash",
  description: "Browse the full collection by category.",
};

const tabClass = (active: boolean) =>
  cn(
    "px-5 py-2 rounded-full text-xs font-medium uppercase tracking-widest whitespace-nowrap transition-all border",
    active
      ? "bg-foreground text-background border-foreground"
      : "bg-transparent text-muted-foreground border-border hover:border-foreground/50",
  );

export default async function LookbookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [categories, feed] = await Promise.all([
    listCategories(),
    listProducts({ category, limit: 50 }),
  ]);

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20">
          <h1 className="font-serif text-4xl mb-4">Lookbook</h1>

          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-6 px-6">
            <Link href="/lookbook" className={tabClass(!category)}>
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/lookbook?category=${cat.slug}`}
                className={tabClass(category === cat.slug)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </header>

        <div className="px-4 pb-8 pt-2">
          {feed.products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {feed.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-muted">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 448px) 50vw, 224px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <div className="absolute top-2 right-2 bg-background text-foreground text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm">
                        New
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    {product.brand}
                  </p>
                  <h3 className="font-medium text-sm mb-1 leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="font-serif text-sm">
                    ${product.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
