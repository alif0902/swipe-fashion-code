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

// Urutan kartu tetap ditentukan mesin selera — listProducts({ rankByTaste })
// di sisi server yang mengerjakannya. Yang dihapus hanya LABEL penjelasnya,
// jadi komponen ini tidak lagi perlu TasteProfile.
export function SwipeFeed({
  products,
  isFiltered = false,
}: {
  products: AppProduct[];
  /**
   * Ada filter 絞り込み yang sedang aktif.
   *
   * Dipakai HANYA untuk keadaan kosong. Tanpa ini, feed yang kosong karena
   * filter terlalu sempit akan berkata「新着はまた入荷します」— menyalahkan
   * katalog atas sesuatu yang sebenarnya bisa dibatalkan sendiri oleh orang
   * yang membacanya, dan menyembunyikan satu-satunya jalan keluarnya.
   */
  isFiltered?: boolean;
}) {
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
  // Melepas filter dari dalam keadaan kosong. Cookienya ditulis di server,
  // jadi halaman perlu diminta ulang untuk membacanya — dan `key` di
  // app/feed/page.tsx yang kemudian menyusun ulang deknya.
  const clearFilter = () => {
    void setFeedFilterAction({})
      .then(() => router.refresh())
      .catch(() => {});
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
      // 2,5 detik — bukan angka bawaan, dan bukan pula 1 detik.
      //
      // Bawaan Radix 5 detik terasa menggantung untuk konfirmasi sesederhana
      // ini. Tapi toast ini membawa 取り消す di bawahnya, dan satu detik tidak
      // cukup untuk menyadari salah tekan LALU mengarahkan jari ke sana —
      // tombol yang tidak sempat diraih sama saja dengan tidak ada.
      duration: 2500,
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
    <div
      className={`relative w-full h-full overflow-hidden ${FEED_BACKDROP}`}
    >
      {/* Panduan gestur kunjungan pertama.

          Dipasang HANYA saat masih ada kartu. Kalau dek sudah habis, tidak ada
          apa pun untuk dipraktikkan dan panduannya cuma menghalangi keadaan
          kosong. Foto kartu terdepan dipinjam sebagai peraga supaya yang
          diperagakan adalah barang sungguhan, bukan kotak abu-abu. */}
      {hasMoreProducts && (
        <FeedCoach previewImage={deck[currentIndex].imageUrl} />
      )}

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
              {/* Tiga keadaan kosong, bukan satu.
                  //
                  // Kalimat「今日はここまで」hanya benar kalau orangnya memang
                  // sudah melihat semuanya. Saat filter menyisakan nol produk,
                  // katalognya tidak habis — pilihannya yang terlalu sempit,
                  // dan itu bisa dibatalkan dalam satu ketukan. Menyamakan
                  // keduanya berarti menyalahkan toko atas sesuatu yang
                  // sebenarnya ada di tangan pembacanya. */}
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

              {/* Kalau tidak ada satu pun produk yang cocok, tidak ada apa pun
                  untuk diputar ulang — tombolnya sengaja tidak dirender, bukan
                  dirender dalam keadaan mati. */}
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
