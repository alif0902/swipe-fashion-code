"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch, RotateCcw } from "lucide-react";

import {
  recordSwipeAction,
  superLikeAction,
  undoSuperLikeAction,
} from "@/app/actions";
import { MatchOverlay } from "@/components/match-overlay";
import { OrderSheet } from "@/components/order-sheet";
import { ProductCard } from "@/components/product-card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type { AppProduct } from "@/lib/format";

// Urutan kartu tetap ditentukan mesin selera — listProducts({ rankByTaste })
// di sisi server yang mengerjakannya. Yang dihapus hanya LABEL penjelasnya,
// jadi komponen ini tidak lagi perlu TasteProfile.
export function SwipeFeed({ products }: { products: AppProduct[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Tumpukan DIBEKUKAN saat komponen dipasang, dan sengaja tidak mengikuti
   * perubahan props sesudahnya.
   *
   * Kenapa ini perlu — dan ini bug yang nyata sebelumnya:
   *
   * Tiap swipe memanggil Server Action, dan Server Action yang memanggil
   * revalidatePath membuat Next merender ulang rute yang sedang dibuka lalu
   * mengirim props baru ke komponen ini. `listProducts` pada render kedua itu
   * mengembalikan daftar yang BERBEDA — barang yang baru saja diputuskan
   * hilang, dan sisanya diurutkan ulang oleh profil selera yang baru saja
   * berubah.
   *
   * Sementara itu `currentIndex` adalah state lokal yang tidak ikut berubah.
   * Jadi products[currentIndex] tiba-tiba menunjuk produk yang sama sekali
   * lain, dan kartu di layar berganti tanpa sebab yang terlihat — persis
   * "feed berubah acak" yang dilaporkan.
   *
   * Membekukan tumpukan juga membuat feed kebal terhadap refresh dari sumber
   * lain: login lewat AuthSheet memanggil router.refresh(), dan tanpa ini
   * kartu yang sedang ditimbang akan ikut melompat.
   */
  const [deck, setDeck] = useState(products);

  // Dua kasus berbeda di balik satu tombol:
  // - Tumpukan yang dimuat sudah habis di-swipe → ambil daftar terbaru yang
  //   sudah dikirim server lewat props, lalu mulai dari awal.
  // - props products KOSONG (mis. database belum di-seed) → tidak ada yang
  //   bisa diputar ulang; satu-satunya jalan adalah minta daftar ke server.
  const handleRestart = () => {
    if (products.length > 0) {
      setDeck(products);
      setCurrentIndex(0);
    } else {
      router.refresh();
    }
  };
  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(
    null,
  );
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  // Produk yang sedang ditampilkan di overlay マッチ. Hanya dipakai geser
  // kanan — いいね tidak lagi memunculkan overlay.
  const [matchedProduct, setMatchedProduct] = useState<AppProduct | null>(null);

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
    record(product, "like");
    advance();
  };

  /**
   * いいね: TANPA overlay.
   *
   * Menyimpan ke 一目惚れ adalah tindakan ringan yang diulang berkali-kali.
   * Layar penuh selama dua detik terasa menyenangkan di kali pertama,
   * mengganggu di kali keempat, dan jadi penghalang di kali kesepuluh.
   *
   * Toast kecil menyampaikan hal yang sama tanpa menahan siapa pun, dan
   * kartunya langsung berganti.
   */
  const handleSuperLike = (product: AppProduct) => {
    void superLikeAction({ productId: product.id }).catch(() => {});
    record(product, "super");
    advance();

    toast({
      title: "一目惚れに保存しました",
      description: product.name,
      // 取り消す ADALAH inti perubahan ini, bukan pelengkap.
      //
      // Overlay dulu memberi jeda untuk sadar salah tekan. Tanpa overlay,
      // jeda itu hilang — dan satu-satunya jalan membatalkan tinggal pergi ke
      // 一目惚れ lalu menghapusnya di sana. Tindakan yang ringan dilakukan
      // harus sama ringannya untuk dibatalkan.
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

  // Dibaca dari `deck` yang beku, BUKAN dari props — kalau dari props,
  // seluruh perbaikan di atas tidak ada gunanya.
  const hasMoreProducts = currentIndex < deck.length;

  return (
    // Gradasi biru → ungu → pink pekat ala aplikasi rujukan, hanya di feed —
    // halaman lain tetap memakai --background polos supaya konten panjang
    // tenang. overflow-hidden di sini juga yang memotong panah navigasi foto
    // jadi setengah lingkaran di tepi layar.
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-sky-200 via-purple-200 to-pink-400">
      {/* Logo dan tombol undo dihapus atas permintaan: kartu kini memakai
          seluruh tinggi layar, jadi tidak ada lagi offset atas. */}
      <div className="relative w-full h-full pt-[env(safe-area-inset-top)]">
        <AnimatePresence>
          {hasMoreProducts ? (
            // HANYA satu kartu yang dirender.
            //
            // Dulu dua kartu ditumpuk supaya kartu berikutnya mengintip di
            // belakang. Itu berhasil selama kartunya satu kotak putih penuh
            // yang menutupi apa pun di bawahnya. Sejak kartu dipecah jadi tiga
            // blok mengambang (foto, thumbnail, panel) dengan celah transparan
            // di antaranya, kartu belakang justru terlihat menyembul lewat
            // celah itu — persis yang terbaca sebagai "bayangan menimpa kartu
            // di bawahnya".
            //
            // Efek tumpukan tidak bisa dipertahankan tanpa mengembalikan latar
            // penuh pada kartu, jadi dilepas.
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
                <PackageSearch className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-3xl mb-3">
                今日はここまで。
              </h2>
              <p className="text-muted-foreground text-lg max-w-[250px] mb-8">
                新着はまた入荷します。「探す」から一覧も見られます。
              </p>
              <button
                type="button"
                onClick={handleRestart}
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
