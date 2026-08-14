"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch, RotateCcw, SlidersHorizontal } from "lucide-react";

import {
  recordSwipeAction,
  setFeedFilterAction,
  superLikeAction,
  undoSuperLikeAction,
} from "@/app/actions";
import { FeedCoach } from "@/components/feed-coach";
import { MatchOverlay } from "@/components/match-overlay";
import { OrderSheet } from "@/components/order-sheet";
import { FEED_BACKDROP, ProductCard } from "@/components/product-card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type { AppProduct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SwipeFeed({
  products,
  isFiltered = false,
}: {
  products: AppProduct[];
  isFiltered?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [deck, setDeck] = useState(products);

  const handleRestart = () => {
    if (products.length > 0) {
      setDeck(products);
      setCurrentIndex(0);
    } else {
      router.refresh();
    }
  };
  const clearFilter = () => {
    void setFeedFilterAction({})
      .then(() => router.refresh())
      .catch(() => {});
  };

  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(
    null,
  );
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  const [matchedProduct, setMatchedProduct] = useState<AppProduct | null>(null);

  const advance = () =>
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);

  const record = (product: AppProduct, direction: "pass" | "like" | "super") => {
    void recordSwipeAction({ productId: product.id, direction }).catch(() => {});
  };

  const handleSwipeRight = (product: AppProduct) => {
    setMatchedProduct(product);
    record(product, "like");
    advance();
  };

  const handleSuperLike = (product: AppProduct) => {
    void superLikeAction({ productId: product.id }).catch(() => {});
    record(product, "super");
    advance();

    toast({
      title: "一目惚れに保存しました",
      description: product.name,
      duration: 2500,
      action: (
        <ToastAction
          altText="取り消す"
          onClick={() => {
            void undoSuperLikeAction(product.id).catch(() => {});
          }}
        >
          取り消す
        </ToastAction>
      ),
    });
  };

  const handleSwipeLeft = (product: AppProduct) => {
    record(product, "pass");
    advance();
  };

  const handleAddToBag = () => {
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
      setIsOrderSheetOpen(true);
    }
    setMatchedProduct(null);
  };

  const handleKeepSwiping = () => {
    setMatchedProduct(null);
  };

  const hasMoreProducts = currentIndex < deck.length;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${FEED_BACKDROP}`}
    >
      {hasMoreProducts && (
        <FeedCoach previewImage={deck[currentIndex].imageUrl} />
      )}

      <div className="relative w-full h-full pt-[env(safe-area-inset-top)]">
        <AnimatePresence>
          {hasMoreProducts ? (
            <ProductCard
              key={`${deck[currentIndex].id}-${currentIndex}`}
              product={deck[currentIndex]}
              isFront
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSuperLike={handleSuperLike}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pb-24"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                {isFiltered && products.length === 0 ? (
                  <SlidersHorizontal className="w-10 h-10 text-muted-foreground" />
                ) : (
                  <PackageSearch className="w-10 h-10 text-muted-foreground" />
                )}
              </div>

              {isFiltered && products.length === 0 ? (
                <>
                  <h2 className="font-serif text-3xl mb-3">
                    この条件の服は、まだありません。
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-[260px] mb-8">
                    絞り込みをゆるめると、また出てきます。
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-3xl mb-3">今日はここまで。</h2>
                  <p className="text-muted-foreground text-lg max-w-[250px] mb-8">
                    新着はまた入荷します。「探す」から一覧も見られます。
                  </p>
                </>
              )}

              {!(isFiltered && products.length === 0) && (
                <button
                  type="button"
                  onClick={handleRestart}
                  data-testid="button-restart-feed"
                  className="inline-flex items-center gap-2.5 h-14 px-8 rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] transition"
                >
                  <RotateCcw className="w-5 h-5" />
                  もう一度見る
                </button>
              )}

              {isFiltered && (
                <button
                  type="button"
                  onClick={clearFilter}
                  data-testid="button-clear-feed-filter"
                  className={cn(
                    "inline-flex items-center gap-2.5 h-14 px-8 rounded-full text-lg font-bold transition",
                    products.length === 0
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02]"
                      : "mt-3 text-muted-foreground hover:text-foreground",
                  )}
                >
                  絞り込みを解除
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MatchOverlay
        product={matchedProduct}
        onAddToBag={handleAddToBag}
        onKeepSwiping={handleKeepSwiping}
      />

      <OrderSheet
        product={selectedProduct}
        isOpen={isOrderSheetOpen}
        onOpenChange={setIsOrderSheetOpen}
      />
    </div>
  );
}
