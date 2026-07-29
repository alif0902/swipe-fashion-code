import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Shirt, Sparkles, Star } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { getTasteProfile, listObsessed } from "@/lib/data";
import { getSessionId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { buildLooks, describeLookGap } from "@/lib/outfit";
import { describeTaste } from "@/lib/taste";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "一目惚れ｜SwipeFash",
  description: "スーパーライクした一着と、そこから組めるコーディネート。",
};

export default async function ObsessedPage() {
  const sessionId = await getSessionId();
  const [products, profile] = await Promise.all([
    listObsessed(sessionId),
    getTasteProfile(sessionId),
  ]);

  const looks = buildLooks(products);
  const gap = describeLookGap(products);
  const summary = describeTaste(profile);

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              スーパーライク
            </span>
          </div>
          <h1 className="font-serif text-4xl">一目惚れ</h1>
          <p className="text-muted-foreground mt-1 max-w-sm">
            スクロールの手が止まった一着。フィードはこの好みに寄っていきます。
          </p>
        </header>

        {/* Pintu masuk ke Style DNA. Muncul begitu ada satu swipe, bukan
            menunggu koleksi terisi — supaya personalisasi terasa lebih awal. */}
        {profile.totalSwipes > 0 && (
          <div className="px-4 mb-8">
            <Link
              href="/style-dna"
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium mb-0.5">あなたのスタイルDNA</p>
                <p className="text-xs text-muted-foreground truncate">
                  {summary
                    ? `${summary}に寄っています`
                    : `これまで${profile.totalSwipes}回のスワイプを学習`}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {Math.round(profile.confidence * 100)}%
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        )}

        {/* Complete the Look — outfit dirakit dari koleksi ini. */}
        {products.length > 0 && (
          <section className="mb-10">
            <div className="px-6 mb-4 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                コーディネート
              </h2>
            </div>

            {looks.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto px-6 pb-2 snap-x snap-mandatory">
                {looks.map((look) => (
                  <div
                    key={look.id}
                    className="snap-start shrink-0 w-[260px] rounded-2xl border border-border bg-card p-3"
                  >
                    <div className="flex gap-2 mb-3">
                      {look.pieces.map((piece) => (
                        <Link
                          key={piece.id}
                          href={`/product/${piece.id}`}
                          className="relative flex-1 aspect-[3/4] rounded-lg overflow-hidden bg-muted"
                        >
                          <Image
                            src={piece.imageUrl}
                            alt={piece.name}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </Link>
                      ))}
                    </div>
                    <div className="flex items-baseline justify-between px-1">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        {look.title}
                      </span>
                      <span className="font-serif text-sm">
                        {formatPrice(
                          look.pieces.reduce((sum, p) => sum + p.price, 0),
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 text-sm text-muted-foreground max-w-sm">
                {gap}
              </p>
            )}
          </section>
        )}

        <div className="px-4 pb-8 pt-2">
          {products.length > 0 ? (
            <>
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4 px-2">
                保存したアイテム
              </h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-muted">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 448px) 50vw, 224px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      {product.brand}
                    </p>
                    <h3 className="font-medium text-sm mb-1 leading-snug line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="font-serif text-sm">
                      {formatPrice(product.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-20 px-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                <Star className="w-9 h-9 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-2xl mb-2">
                まだ一目惚れはありません。
              </h2>
              <p className="text-muted-foreground max-w-[260px] mb-6">
                気になる一着を上にスワイプ、または星をタップ。ここに保存され、フィードの好みにも反映されます。
              </p>
              <Link
                href="/feed"
                className="h-12 px-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center uppercase text-sm tracking-widest font-medium hover:scale-[1.03] transition-transform"
              >
                スワイプを始める
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
