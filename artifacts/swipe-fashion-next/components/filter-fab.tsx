"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "recommended", label: "おすすめ順" },
  { value: "price-asc", label: "価格が安い順" },
  { value: "price-desc", label: "価格が高い順" },
  { value: "new", label: "新着順" },
] as const;

/**
 * Tombol mengambang 絞り込む, khusus halaman 探す.
 *
 * Ditaruh mengambang di kanan bawah — bukan di dalam header — karena filter
 * dibutuhkan SETELAH pengguna menggulir daftar dan melihat hasilnya. Header
 * sudah lama hilang dari layar pada saat itu.
 *
 * Semua pilihan disimpan di query string, bukan di state React. Konsekuensinya
 * hasil filter bisa di-bookmark dan di-share, tombol back browser bekerja
 * seperti yang diharapkan, dan daftarnya tetap dirender di server.
 */
export function FilterFab({
  params,
  resultCount,
}: {
  // Dioper dari Server Component, bukan dibaca lewat useSearchParams. Hook itu
  // memaksa adanya Suspense boundary saat next build dan bisa menggagalkan
  // build — padahal nilainya sudah ada di server.
  params: Record<string, string | undefined>;
  resultCount: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const sort = params.sort ?? "recommended";
  const inStock = params.stock === "1";

  // Hanya filter yang mengubah hasil yang dihitung sebagai "aktif". Gender dan
  // kategori punya kontrolnya sendiri di header, jadi tidak ikut dihitung —
  // kalau ikut, lencananya akan menyala terus dan kehilangan arti.
  const activeCount = (sort !== "recommended" ? 1 : 0) + (inStock ? 1 : 0);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...patch })) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `/lookbook?${qs}` : "/lookbook", { scroll: false });
  };

  const clear = () => update({ sort: null, stock: null });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        data-testid="button-filter"
        aria-label="絞り込む"
        className="absolute bottom-5 right-5 z-30 h-14 pl-4 pr-5 rounded-full bg-foreground text-background shadow-xl flex items-center gap-2 transition hover:scale-[1.03]"
      >
        <span className="relative">
          <SlidersHorizontal className="w-5 h-5" />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-sm font-bold">絞り込む</span>
      </button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-sans font-bold text-xl tracking-normal text-left">
              絞り込む
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-6">
            <section>
              <h3 className="text-sm font-bold text-foreground/70 mb-3">
                並び替え
              </h3>
              <div className="space-y-1.5">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() =>
                      update({
                        sort: s.value === "recommended" ? null : s.value,
                      })
                    }
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition",
                      sort === s.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "bg-card border border-border hover:border-primary/40",
                    )}
                  >
                    {s.label}
                    {sort === s.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-foreground/70 mb-3">在庫</h3>
              <button
                type="button"
                onClick={() => update({ stock: inStock ? null : "1" })}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition",
                  inStock
                    ? "bg-primary/10 text-primary font-medium"
                    : "bg-card border border-border hover:border-primary/40",
                )}
              >
                在庫があるものだけ
                {inStock && <Check className="w-4 h-4" />}
              </button>
            </section>

            <div className="flex gap-3 pt-1">
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-full text-muted-foreground"
                onClick={clear}
                disabled={activeCount === 0}
              >
                クリア
              </Button>
              <Button
                className="flex-[2] h-12 rounded-full font-bold"
                onClick={() => setIsOpen(false)}
              >
                {resultCount}点を見る
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
