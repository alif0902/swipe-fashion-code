"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";

import { ObsessedDeleteButton } from "@/components/obsessed-delete-button";
import { OrderSheet } from "@/components/order-sheet";
import { formatPrice, type AppProduct } from "@/lib/format";

export function ObsessedGrid({ products }: { products: AppProduct[] }) {
  const [selected, setSelected] = useState<AppProduct | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const start = (product: AppProduct) => {
    setSelected(product);
    setIsSheetOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group rounded-2xl bg-card border border-border/70 overflow-hidden shadow-sm"
          >
            <div className="relative aspect-[3/4] bg-muted">
              <Link href={`/product/${product.id}`} className="absolute inset-0">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 448px) 50vw, 224px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>

              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-1 shadow-sm pointer-events-none">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span className="text-[10px] font-bold text-primary">
                  一目惚れ
                </span>
              </span>

              <ObsessedDeleteButton productId={product.id} />

              <button
                type="button"
                onClick={() => start(product)}
                data-testid={`button-bag-${product.id}`}
                aria-label="バッグに入れる"
                title="バッグに入れる"
                className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center text-foreground/80 transition hover:scale-105 hover:text-primary active:scale-95 md:opacity-0 md:group-hover:opacity-100"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>

            <Link href={`/product/${product.id}`} className="block p-3">
              <p className="text-[10px] text-muted-foreground tracking-[0.12em] truncate">
                {product.brand}
              </p>
              <h3 className="font-sans font-bold text-[13px] leading-snug line-clamp-2 mt-0.5 min-h-[2.4em]">
                {product.name}
              </h3>
              <p className="font-sans font-bold text-sm text-primary tabular-nums mt-1">
                {formatPrice(product.price)}
              </p>
            </Link>
          </div>
        ))}
      </div>

      <OrderSheet
        product={selected}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
