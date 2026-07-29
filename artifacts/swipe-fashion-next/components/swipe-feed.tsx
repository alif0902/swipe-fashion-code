"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch, RotateCcw } from "lucide-react";

import { recordSwipeAction, superLikeAction } from "@/app/actions";
import { MatchOverlay, type MatchType } from "@/components/match-overlay";
import { OrderSheet } from "@/components/order-sheet";
import { ProductCard } from "@/components/product-card";
import type { AppProduct } from "@/lib/format";

export function SwipeFeed({ products }: { products: AppProduct[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(
    null,
  );
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  // Produk yang sedang ditampilkan di overlay "It's a Match!".
  const [matchedProduct, setMatchedProduct] = useState<AppProduct | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("match");

  const advance = () =>
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);

  // Setiap keputusan dikirim ke server, termasuk swipe kiri. Fire-and-forget
  // secara sengaja: personalisasi tidak boleh menahan animasi kartu. Kalau
  // request gagal, yang hilang cuma satu sinyal — swipe tetap terasa instan.
  const record = (product: AppProduct, direction: "pass" | "like" | "super") => {
    void recordSwipeAction({ productId: product.id, direction }).catch(() => {});
  };

  const handleSwipeRight = (product: AppProduct) => {
    setMatchedProduct(product);
    setMatchType("match");
    record(product, "like");
    advance();
  };

  const handleSuperLike = (product: AppProduct) => {
    setMatchedProduct(product);
    setMatchType("super");
    // Simpan ke koleksi Obsessed (dan boost feed). Fire-and-forget: kalau
    // gagal, momen "Super Match" tetap jalan.
    void superLikeAction({ productId: product.id }).catch(() => {});
    record(product, "super");
    advance();
  };

  const handleSwipeLeft = (product: AppProduct) => {
    // Dulu fungsi ini hanya memanggil advance() dan sinyalnya terbuang.
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

  const hasMoreProducts = currentIndex < products.length;

  return (
    // Gradasi biru → ungu → pink pekat ala aplikasi rujukan, hanya di feed —
    // halaman lain tetap memakai --background polos supaya konten panjang
    // tenang. overflow-hidden di sini juga yang memotong panah navigasi foto
    // jadi setengah lingkaran di tepi layar.
    <div className="relative w-full h-[calc(100dvh-64px-env(safe-area-inset-bottom))] overflow-hidden bg-gradient-to-b from-sky-200 via-purple-200 to-pink-400">
      {/* Logo dan tombol undo dihapus atas permintaan: kartu kini memakai
          seluruh tinggi layar, jadi tidak ada lagi offset atas. */}
      <div className="relative w-full h-full pt-[env(safe-area-inset-top)]">
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
                  onSuperLike={handleSuperLike}
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
                今日はここまで。
              </h2>
              <p className="text-muted-foreground text-lg max-w-[250px] mb-8">
                新着はまた入荷します。「探す」から一覧も見られます。
              </p>
              {/* Reset LOKAL yang disengaja, bukan router.refresh(): feed di
                  server menyembunyikan produk yang sudah diputuskan, jadi
                  refresh pada katalog yang sudah habis hanya mengembalikan
                  layar kosong ini lagi. Memutar ulang tumpukan yang sama
                  membuat tombolnya selalu berfungsi — penting untuk demo. */}
              <button
                type="button"
                onClick={() => setCurrentIndex(0)}
                data-testid="button-restart-feed"
                className="inline-flex items-center gap-2.5 h-14 px-8 rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] transition"
              >
                <RotateCcw className="w-5 h-5" />
                もう一度見る
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MatchOverlay
        product={matchedProduct}
        type={matchType}
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
