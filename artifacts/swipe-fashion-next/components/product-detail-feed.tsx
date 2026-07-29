"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

import { recordSwipeAction, superLikeAction } from "@/app/actions";
import { MatchOverlay, type MatchType } from "@/components/match-overlay";
import { OrderSheet } from "@/components/order-sheet";
import { ProductCard } from "@/components/product-card";
import type { AppProduct } from "@/lib/format";

/**
 * Satu produk, ditampilkan persis seperti kartu di feed.
 *
 * Komponen ini sengaja memakai ulang ProductCard apa adanya, bukan meniru
 * tampilannya. Kalau tata letak kartu feed berubah, halaman ini ikut berubah
 * sendiri — tidak ada dua salinan yang bisa saling menyimpang.
 *
 * Bedanya hanya pada apa yang terjadi setelah aksi. Di feed, kartu berikutnya
 * menggantikan yang sekarang; di sini tidak ada tumpukan, jadi:
 * - パス   → kembali ke halaman sebelumnya
 * - いいね！ → overlay match, lalu bisa lanjut ke bag
 * - スーパー → simpan ke 一目惚れ, overlay super
 *
 * Swipe tetap merekam sinyal ke mesin selera, sama seperti di feed. Artinya
 * menelusuri katalog lewat 探す juga ikut melatih profil, bukan cuma feed.
 */
export function ProductDetailFeed({ product }: { product: AppProduct }) {
  const router = useRouter();
  const [matchedProduct, setMatchedProduct] = useState<AppProduct | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("match");
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(
    null,
  );

  const record = (direction: "pass" | "like" | "super") => {
    void recordSwipeAction({ productId: product.id, direction }).catch(() => {});
  };

  const handleSwipeLeft = () => {
    record("pass");
    router.back();
  };

  const handleSwipeRight = () => {
    record("like");
    setMatchType("match");
    setMatchedProduct(product);
  };

  const handleSuperLike = () => {
    void superLikeAction({ productId: product.id }).catch(() => {});
    record("super");
    setMatchType("super");
    setMatchedProduct(product);
  };

  const handleAddToBag = () => {
    setSelectedProduct(product);
    setIsOrderSheetOpen(true);
    setMatchedProduct(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-sky-200 via-purple-200 to-pink-400">
      {/* Tombol kembali dibutuhkan di sini tapi tidak di feed: halaman ini
          punya tempat asal, sedangkan feed adalah tujuan itu sendiri. */}
      <Link
        href="/lookbook"
        aria-label="戻る"
        data-testid="link-back"
        className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 z-50 rounded-full w-10 h-10 bg-white/60 backdrop-blur-md flex items-center justify-center text-foreground/70 shadow-sm"
      >
        <ChevronLeft className="w-6 h-6" />
      </Link>

      <div className="relative w-full h-full pt-[env(safe-area-inset-top)]">
        <AnimatePresence>
          <ProductCard
            key={product.id}
            product={product}
            isFront
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onSuperLike={handleSuperLike}
          />
        </AnimatePresence>
      </div>

      <MatchOverlay
        product={matchedProduct}
        type={matchType}
        onAddToBag={handleAddToBag}
        onKeepSwiping={() => setMatchedProduct(null)}
      />

      <OrderSheet
        product={selectedProduct}
        isOpen={isOrderSheetOpen}
        onOpenChange={setIsOrderSheetOpen}
      />
    </div>
  );
}
