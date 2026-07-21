"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch } from "lucide-react";

import { OrderSheet } from "@/components/order-sheet";
import { ProductCard } from "@/components/product-card";
import type { AppProduct } from "@/lib/format";

export function SwipeFeed({ products }: { products: AppProduct[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(
    null,
  );
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  const handleSwipeRight = (product: AppProduct) => {
    setSelectedProduct(product);
    setIsOrderSheetOpen(true);
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  const handleSwipeLeft = () => {
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  const hasMoreProducts = currentIndex < products.length;

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden bg-background">
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-center pointer-events-none">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          SWIPE
          <span className="text-muted-foreground font-normal italic">Fash</span>
        </h1>
      </div>

      <div className="relative w-full h-full pt-16">
        <AnimatePresence>
          {hasMoreProducts ? (
            products
              .slice(currentIndex, currentIndex + 2)
              .map((product, index) => (
                <ProductCard
                  key={`${product.id}-${currentIndex}`}
                  product={product}
                  isFront={index === 0}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              ))
              .reverse()
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pb-24"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <PackageSearch className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-3xl mb-3">
                You&apos;re all caught up.
              </h2>
              <p className="text-muted-foreground text-lg max-w-[250px]">
                Check back later for new arrivals or browse the lookbook.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OrderSheet
        product={selectedProduct}
        isOpen={isOrderSheetOpen}
        onOpenChange={setIsOrderSheetOpen}
      />
    </div>
  );
}
