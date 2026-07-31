import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shirt, Star } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { ObsessedGrid } from "@/components/obsessed-grid";
import { listObsessed } from "@/lib/data";
import { getOwnerId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { buildLooks, describeLookGap } from "@/lib/outfit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "一目惚れ｜SwipeFash",
  description: "「いいね！」した一着と、そこから組めるコーディネート。",
};

export default async function ObsessedPage() {
  const sessionId = await getOwnerId();
  // Profil selera tidak lagi dibaca di sini. Kartu スタイルDNA sudah punya
  // tempatnya sendiri di マイページ, dan menampilkannya dua kali membuat
  // halaman ini terasa seperti dasbor alih-alih koleksi.
  const products = await listObsessed(sessionId);

  const looks = buildLooks(products);
  const gap = describeLookGap(products);

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <PageHeader
          icon={Star}
          eyebrow="SUPER LIKE"
          title="一目惚れ"
          subtitle="スクロールの手が止まった一着。フィードはこの好みに寄っていきます。"
          count={products.length}
          countLabel="点"
        />

        {products.length > 0 ? (
          <>
            {/* 保存したアイテム naik ke atas.
                Yang dicari orang saat membuka halaman ini adalah barang yang
                mereka simpan sendiri — コーディネート adalah turunan dari
                koleksi itu, jadi ia semestinya datang sesudahnya, bukan
                mendahuluinya. */}
            <div className="px-4 pt-2">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Star className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground/70">
                  保存したアイテム
                </h2>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {products.length}点
                </span>
              </div>
              <ObsessedGrid products={products} />
            </div>

            {/* Complete the Look — outfit dirakit dari koleksi di atas. */}
            <section className="mt-10 pb-10">
              {/* Garis pemisah tipis. Tanpa ini kedua seksi menyatu jadi satu
                  aliran panjang di latar merah muda, dan コーディネート
                  terbaca seperti lanjutan daftar di atasnya. */}
              <div className="h-px bg-border/60 mx-6 mb-6" />

              <div className="px-5 mb-4 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground/70">
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
                        <span className="text-xs font-medium text-muted-foreground">
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
                // Keadaan kosong diberi wadah bergaris putus-putus, bukan
                // kalimat telanjang di atas latar. Teks yang mengambang
                // sendirian terbaca seperti konten yang gagal dimuat; kotak
                // ini menyatakan bahwa memang belum ada isinya.
                <div className="mx-5 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-8 flex flex-col items-center text-center">
                  <span className="w-11 h-11 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Shirt className="w-5 h-5 text-muted-foreground" />
                  </span>
                  <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                    {gap}
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Star className="w-9 h-9 text-muted-foreground" />
            </div>
            <h2 className="font-sans font-bold text-xl mb-2">
              まだ一目惚れはありません。
            </h2>
            <p className="text-muted-foreground max-w-[260px] mb-6">
              フィードで「いいね！」を押すと、ここに保存されます。好みの学習にも反映されます。
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
    </AppLayout>
  );
}
