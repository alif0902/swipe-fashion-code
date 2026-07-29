"use client";

import { useState } from "react";

import { OrderSheet } from "@/components/order-sheet";
import { Button } from "@/components/ui/button";
import type { AppProduct } from "@/lib/format";

export function ProductDetailActions({ product }: { product: AppProduct }) {
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
        <div className="max-w-md mx-auto p-4 flex gap-4">
          <Button
            className="flex-1 h-14 rounded-full text-lg font-medium"
            onClick={() => setIsOrderSheetOpen(true)}
            data-testid="button-open-order-sheet"
          >
            Add to Bag
          </Button>
        </div>
      </div>

      <OrderSheet
        product={product}
        isOpen={isOrderSheetOpen}
        onOpenChange={setIsOrderSheetOpen}
      />
    </>
  );
}
