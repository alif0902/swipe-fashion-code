"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag, Sparkles, Star } from "lucide-react";

import { formatPrice, type AppProduct } from "@/lib/format";

export type MatchType = "match" | "super";

export function MatchOverlay({
  product,
  type,
  onAddToBag,
  onKeepSwiping,
}: {
  product: AppProduct | null;
  type: MatchType;
  onAddToBag: () => void;
  onKeepSwiping: () => void;
}) {
  const isSuper = type === "super";

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          key="match-overlay"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className={
              isSuper
                ? "absolute inset-0 bg-gradient-to-b from-violet-500/95 to-primary/95 backdrop-blur-sm"
                : "absolute inset-0 bg-gradient-to-b from-primary/95 to-rose-500/95 backdrop-blur-sm"
            }
          />

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
              {isSuper ? (
                <Star className="w-7 h-7 fill-current" />
              ) : (
                <Heart className="w-8 h-8 fill-current" />
              )}
            </motion.div>
          ))}

          {/* Card */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center text-white"
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.3em] text-[11px] mb-3 text-white/80">
              {isSuper ? (
                <Star className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isSuper ? "一目惚れ" : "マッチ"}
            </span>
            <h2 className="font-serif text-5xl md:text-6xl mb-6 leading-none">
              {isSuper ? "一目惚れしました！" : "マッチしました！"}
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
            <p className="font-serif text-2xl leading-tight mb-1">
              {product.name}
            </p>
            <p className="text-white/90 mb-2">{formatPrice(product.price)}</p>

            {isSuper ? (
              <p className="inline-flex items-center gap-1.5 text-white text-sm mb-8">
                <Star className="w-4 h-4 fill-current" /> 一目惚れリストに追加しました
              </p>
            ) : (
              <div className="mb-6" />
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {isSuper ? (
                <>
                  <button
                    type="button"
                    onClick={onKeepSwiping}
                    className="h-14 rounded-full bg-white text-primary font-sans font-semibold uppercase tracking-[0.15em] text-sm flex items-center justify-center hover:scale-[1.03] transition-transform"
                    data-testid="button-match-keep"
                  >
                    スワイプを続ける
                  </button>
                  <Link
                    href="/obsessed"
                    className="h-12 rounded-full border border-white/50 text-white font-sans text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    data-testid="link-view-obsessed"
                  >
                    <Star className="w-4 h-4" />
                    一目惚れを見る
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onAddToBag}
                    className="h-14 rounded-full bg-white text-primary font-sans font-semibold uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 hover:scale-[1.03] transition-transform"
                    data-testid="button-match-add"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    バッグに入れる
                  </button>
                  <button
                    type="button"
                    onClick={onKeepSwiping}
                    className="h-12 rounded-full border border-white/50 text-white font-sans text-sm uppercase tracking-[0.15em] hover:bg-white/10 transition-colors"
                    data-testid="button-match-keep"
                  >
                    スワイプを続ける
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
