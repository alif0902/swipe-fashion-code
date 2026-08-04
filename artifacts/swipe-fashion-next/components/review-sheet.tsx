"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";

import { createReviewAction, listReviewsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { AppReview } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Panel ulasan produk.
 *
 * Dibuka dari baris 評価 di blok 基本情報. Barisnya dulu hanya teks mati —
 * angka「4.6（61件）」tanpa cara apa pun melihat isinya, yang membuat
 * penilaiannya terbaca sebagai hiasan.
 *
 * Memakai Drawer yang sama dengan lembar pemesanan, jadi dua panel utama
 * aplikasi ini muncul dan menutup dengan gerakan yang identik.
 */

function Stars({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "lg";
}) {
  const px = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}点`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            px,
            // Bintang yang belum terisi tetap digambar, bukan dihilangkan —
            // tanpa itu, "3 dari 5" terlihat seperti "3 dari 3".
            n <= Math.round(value)
              ? "fill-primary text-primary"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </span>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function ReviewSheet({
  productId,
  productName,
  rating,
  reviewCount,
  isOpen,
  onOpenChange,
}: {
  productId: number;
  productName: string;
  /** null = belum ada penilaian sama sekali (produk baru dari admin). */
  rating: number | null;
  reviewCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Diambil saat panel dibuka, bukan saat kartu dirender.
  //
  // `cancelled` menjaga panel yang keburu ditutup tidak menulis hasil yang
  // datang belakangan — tanpa itu, membuka lalu menutup cepat bisa mengisi
  // daftar milik produk yang sudah tidak dilihat.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);

    listReviewsAction(productId)
      .then((rows) => {
        if (!cancelled) setReviews(rows);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId]);
  const [isWriting, setIsWriting] = useState(false);
  const [stars, setStars] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tiga teratas saat tertutup — sisanya di balik tombol, supaya panel tidak
  // membuka dengan gulungan panjang.
  const visible = showAll ? reviews : reviews.slice(0, 3);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createReviewAction({
        productId,
        rating: stars,
        authorName: name,
        body,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast({ title: "レビューを投稿しました", duration: 3000 });
      setIsWriting(false);
      setName("");
      setBody("");
      setStars(5);

      // Daftar diambil ulang supaya ulasan yang baru ditulis langsung terlihat
      // dengan lencana「あなた」. revalidatePath di server hanya menyegarkan
      // halaman, bukan state panel yang sedang terbuka.
      setReviews(await listReviewsAction(productId));
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-card-border rounded-t-3xl text-card-foreground max-h-[85dvh]">
        <DrawerHeader className="text-left pt-6 pb-2">
          <DrawerTitle className="text-xl">レビュー</DrawerTitle>
          <DrawerDescription className="sr-only">
            {productName}のレビュー一覧
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          {/* ---- Ringkasan ---- */}
          {rating === null ? (
            // Produk baru belum punya penilaian. Menampilkan「0.0」dan lima
            // bintang kosong terbaca seperti produk yang dinilai buruk, bukan
            // produk yang belum dinilai — dua hal yang sangat berbeda.
            <p className="text-sm text-muted-foreground text-center rounded-2xl bg-muted/40 px-5 py-6 mb-5">
              まだ評価がありません。
            </p>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl bg-muted/40 px-5 py-4 mb-5">
              <div className="text-center shrink-0">
                <p className="font-serif text-4xl leading-none">
                  {rating.toFixed(1)}
                </p>
                <div className="mt-2">
                  <Stars value={rating} size="lg" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {reviewCount}件の評価
                {reviews.length < reviewCount && (
                  <>
                    <br />
                    うち{reviews.length}件のコメントを掲載しています。
                  </>
                )}
              </p>
            </div>
          )}

          {/* ---- Daftar ---- */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              まだコメントがありません。最初のひとことをどうぞ。
            </p>
          ) : (
            <ul className="space-y-4">
              {visible.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-border/60 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {/* Avatar inisial, bukan foto. Tidak ada foto asli untuk
                        dipakai, dan gambar palsu di sebelah nama palsu justru
                        membuat ulasannya terasa dibuat-buat. */}
                    <span className="w-8 h-8 shrink-0 rounded-full bg-primary/12 text-primary flex items-center justify-center text-xs font-bold">
                      {r.authorName.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold leading-tight truncate">
                        {r.authorName}
                        {r.isMine && (
                          <span className="ml-1.5 text-[10px] font-medium text-primary">
                            あなた
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  {/* Dirender sebagai teks biasa, bukan HTML — tidak ada jalur
                      penyisipan skrip lewat kolom ulasan. */}
                  <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                    {r.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {reviews.length > 3 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full mt-4 text-sm text-muted-foreground underline hover:text-foreground transition-colors"
            >
              すべてのコメントを見る（{reviews.length}件）
            </button>
          )}

          {/* ---- Form ---- */}
          <div className="mt-6 pt-5 border-t border-border">
            {!isWriting ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWriting(true)}
                data-testid="button-write-review"
                className="w-full h-12 rounded-full font-bold"
              >
                レビューを書く
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">評価</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStars(n)}
                        aria-label={`${n}点`}
                        className="p-1 transition-transform active:scale-90"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8",
                            n <= stars
                              ? "fill-primary text-primary"
                              : "fill-muted text-muted",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="お名前（ニックネームで結構です）"
                  maxLength={20}
                  className="h-11 rounded-xl"
                />

                <div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="サイズ感や着心地など、迷っている方の参考になることを教えてください。"
                    maxLength={500}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-1 tabular-nums">
                    {body.trim().length} / 500
                  </p>
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsWriting(false)}
                    disabled={isPending}
                    className="flex-1 h-12 rounded-full"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={submit}
                    disabled={isPending}
                    data-testid="button-submit-review"
                    className="flex-1 h-12 rounded-full font-bold"
                  >
                    {isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    投稿する
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
