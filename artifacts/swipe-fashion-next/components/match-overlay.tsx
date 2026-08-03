"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";

import { formatPrice, type AppProduct } from "@/lib/format";

/**
 * Hanya satu jenis: マッチ dari geser kanan.
 *
 * Varian「スーパーマッチ」dihapus bersama overlay untuk いいね — menyimpan ke
 * 一目惚れ sekarang cukup dilaporkan lewat toast. Tipe `MatchType` ikut dibuang
 * daripada dibiarkan menyisakan cabang yang tidak pernah dijalankan.
 */

/** Berapa lama momen match ditahan sebelum menutup sendiri. */
const AUTO_CLOSE_MS = 2000;

export function MatchOverlay({
  product,
  onAddToBag,
  onKeepSwiping,
}: {
  product: AppProduct | null;
  onAddToBag: () => void;
  onKeepSwiping: () => void;
}) {
  /**
   * Menutup sendiri setelah dua detik, supaya swipe berturut-turut tetap
   * mengalir tanpa harus menekan「スワイプを続ける」setiap kali.
   *
   * TAPI hitungannya BERHENTI begitu layar disentuh. Ini bukan kehalusan
   * tambahan — tanpa itu, tombol「バッグに入れる」bisa lenyap tepat saat jari
   * bergerak ke arahnya, dan geser kanan adalah SATU-SATUNYA jalan menuju
   * pembelian di aplikasi ini. Timer yang membatalkan pembelian orang adalah
   * bug, bukan fitur.
   */
  const [isPaused, setIsPaused] = useState(false);

  // Direset tiap kali overlay dibuka untuk produk lain; kalau tidak, jeda dari
  // match sebelumnya ikut terbawa dan yang berikutnya tidak pernah menutup.
  useEffect(() => {
    setIsPaused(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product || isPaused) return;

    const timer = setTimeout(onKeepSwiping, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
    // onKeepSwiping stabil sepanjang umur SwipeFeed, jadi tidak ikut dijadikan
    // dependensi — memasukkannya membuat timer disetel ulang tiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, isPaused]);

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          key="match-overlay"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6"
          // Sentuhan di mana pun menghentikan hitungan mundur. Cukup sekali —
          // begitu orang menyentuh layar, ia sedang memutuskan sesuatu, dan
          // keputusan itu tidak boleh punya batas waktu.
          onPointerDown={() => setIsPaused(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/95 to-rose-500/95 backdrop-blur-sm" />

          {/* Floating hearts / sparkles */}
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/30"
              style={{ left: `${8 + i * 13}%`, bottom: "-2rem" }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -560, opacity: [0, 1, 0] }}
              transition={{
                duration: 2.6 + i * 0.25,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut",
              }}
            >
              <Heart className="w-8 h-8 fill-current" />
            </motion.div>
          ))}

          {/* Card */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center text-white"
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            {/* tracking dilepas dari label Jepang. Pelebaran jarak huruf tidak
                berlaku untuk kana/kanji sebagai gaya — ia hanya merenggangkan
                karakter dan membuatnya terbaca seperti teks yang rusak.
                Aturan yang sama sudah dipakai di tab kategori 探す. */}
            <span className="inline-flex items-center gap-2 text-[11px] mb-3 text-white/80">
              <Sparkles className="w-3.5 h-3.5" />
              マッチ
            </span>
            {/* whitespace-nowrap + ukuran diturunkan dari 5xl ke 4xl.
                「マッチしました！」 delapan karakter, dan pada 48px ia melebihi
                lebar layar ponsel lalu patah jadi 「マッチしまし / た！」 —
                pemenggalan yang membelah satu kata dan terbaca kacau.
                Jepang tidak memakai tanda hubung, jadi satu-satunya cara
                mencegahnya adalah memastikan barisnya memang muat. */}
            <h2 className="font-serif text-4xl mb-7 leading-none whitespace-nowrap">
              マッチしました！
            </h2>

            <div className="w-48 h-60 rounded-3xl overflow-hidden border-4 border-white shadow-2xl mb-5 bg-white/10">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-white/75 uppercase text-[11px] tracking-[0.2em] mb-1">
              {product.brand}
            </p>
            {/* px-6 + dua baris: nama seperti「リネンテーラードジャケット」
                nyaris selebar layar dan tanpa ini menyentuh tepi kiri-kanan. */}
            <p className="font-serif text-xl leading-snug mb-1 px-6 line-clamp-2">
              {product.name}
            </p>
            <p className="text-white/90 mb-8">{formatPrice(product.price)}</p>

            {/* Bilah waktu.
                Overlay yang menutup sendiri tanpa peringatan terasa seperti
                aplikasi yang error. Garis tipis ini membuat dua detik itu
                terlihat, dan ia ikut hilang begitu hitungannya dihentikan —
                sehingga jelas bahwa sentuhanmu berhasil menahannya. */}
            {!isPaused && (
              <div className="w-full max-w-xs h-0.5 rounded-full bg-white/25 overflow-hidden mb-5">
                <motion.div
                  className="h-full bg-white/70"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={onAddToBag}
                className="h-14 rounded-full bg-white text-primary font-sans font-bold text-base flex items-center justify-center gap-2 hover:scale-[1.03] transition-transform"
                data-testid="button-match-add"
              >
                <ShoppingBag className="w-5 h-5" />
                バッグに入れる
              </button>
              <button
                type="button"
                onClick={onKeepSwiping}
                className="h-12 rounded-full border border-white/50 text-white font-sans text-sm font-medium hover:bg-white/10 transition-colors"
                data-testid="button-match-keep"
              >
                スワイプを続ける
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
