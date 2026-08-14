"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Mars, Users, Venus } from "lucide-react";

import { setFeedFilterAction } from "@/app/actions";
import { FilterFabShell } from "@/components/filter-fab-shell";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/format";
import { countActiveFeedFilters, type FeedFilter } from "@/lib/feed-filter";
import { cn } from "@/lib/utils";

const GENDERS = [
  { value: "women", label: "レディース", icon: Venus, accent: "text-pink-500" },
  { value: "men", label: "メンズ", icon: Mars, accent: "text-sky-500" },
] as const;

/**
 * Isi laci 絞り込む untuk FEED.
 *
 * Bedanya dengan 探す ada di dua hal, dan keduanya disengaja:
 *
 *   1. TIDAK ADA 並び替え. Urutan feed milik mesin selera. Menaruh menu urutan
 *      di sini akan membacanya sebagai salah satu pilihan, padahal ia cara
 *      kerja halamannya.
 *   2. Disimpan di cookie, bukan query string — lihat lib/feed-filter.ts.
 *      Halaman feed dirender ulang lewat router.refresh() setelah cookienya
 *      ditulis, dan `key` di app/feed/page.tsx yang memaksa dek disusun ulang.
 */
export function FeedFilterFab({
  filter,
  categories,
}: {
  filter: FeedFilter;
  categories: { id: number; slug: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeCount = countActiveFeedFilters(filter);

  const apply = (next: FeedFilter) => {
    startTransition(async () => {
      await setFeedFilterAction(next);
      // Cookie ditulis di server, jadi halaman harus diminta ulang untuk
      // membacanya. Tanpa ini tidak ada yang berubah di layar.
      router.refresh();
    });
  };

  const rowClass = (active: boolean) =>
    cn(
      "w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition",
      active
        ? "bg-primary/10 text-primary font-medium"
        : "bg-card border border-border hover:border-primary/40",
    );

  return (
    <FilterFabShell
      activeCount={activeCount}
      title="絞り込む"
      // Di atas tombol いいね！, bukan menimpanya: --nav-clearance adalah dasar
      // tombol itu, dan 4,5rem adalah tingginya (3rem) ditambah napas.
      // Tetap bisa digeser kalau posisi ini pun menghalangi.
      positionClassName="bottom-[calc(var(--nav-clearance)+4.5rem)] right-5"
    >
      {(close) => (
        <>
          <section>
            <h3 className="text-sm font-bold text-foreground/70 mb-3">性別</h3>
            <div className="space-y-1.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => apply({ ...filter, gender: undefined })}
                className={rowClass(!filter.gender)}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  すべて
                </span>
                {!filter.gender && <Check className="w-4 h-4" />}
              </button>

              {GENDERS.map((g) => {
                const Icon = g.icon;
                const active = filter.gender === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    disabled={isPending}
                    onClick={() => apply({ ...filter, gender: g.value })}
                    className={rowClass(active)}
                  >
                    <span className="flex items-center gap-2">
                      {/* Ikon diberi warna khas gendernya hanya saat aktif.
                          Kalau selalu berwarna, keduanya bersaing menarik
                          perhatian dan justru tidak jelas mana yang terpilih. */}
                      <Icon className={cn("w-4 h-4", active && g.accent)} />
                      {g.label}
                    </span>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-foreground/70 mb-3">
              カテゴリー
            </h3>
            {/* Satu kategori saja, bukan pilihan ganda. Feed hanya punya sepuluh
                kartu sekali muat; menyaring ke dua kategori sekaligus nyaris
                tidak berbeda dari tidak menyaring, dan kotak centang ganda
                menuntut orang menyusun kombinasi di halaman yang justru
                dirancang untuk keputusan sekejap. */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => apply({ ...filter, category: undefined })}
                className={cn(
                  "h-10 px-4 rounded-full text-sm font-medium border transition",
                  !filter.category
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "border-border hover:border-primary/40",
                )}
              >
                すべて
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => apply({ ...filter, category: c.slug })}
                  className={cn(
                    "h-10 px-4 rounded-full text-sm font-medium border transition",
                    filter.category === c.slug
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {categoryLabel(c.slug)}
                </button>
              ))}
            </div>
          </section>

          {/* Tidak ada「N点を見る」seperti di 探す.
              Feed memuat sepuluh kartu sekali jalan dan menyembunyikan yang
              sudah diputuskan, jadi angka apa pun yang ditulis di sini akan
              berbeda dari jumlah yang benar-benar tersisa untuk di-swipe. */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-full text-muted-foreground"
              onClick={() => apply({})}
              disabled={activeCount === 0 || isPending}
            >
              クリア
            </Button>
            <Button
              className="flex-[2] h-12 rounded-full font-bold"
              onClick={close}
            >
              この条件で見る
            </Button>
          </div>
        </>
      )}
    </FilterFabShell>
  );
}
