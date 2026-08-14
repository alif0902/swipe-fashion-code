"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { FilterFabShell } from "@/components/filter-fab-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_SORT = "new";

const SORTS = [
  { value: "new", label: "新着順" },
  { value: "price-asc", label: "価格が安い順" },
  { value: "price-desc", label: "価格が高い順" },
] as const;

export function FilterFab({
  params,
  resultCount,
}: {
  params: Record<string, string | undefined>;
  resultCount: number;
}) {
  const router = useRouter();

  const sort = params.sort ?? DEFAULT_SORT;
  const inStock = params.stock === "1";

  const activeCount = (sort !== DEFAULT_SORT ? 1 : 0) + (inStock ? 1 : 0);

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
    <FilterFabShell activeCount={activeCount} title="絞り込む">
      {(close) => (
        <>
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
                      sort: s.value === DEFAULT_SORT ? null : s.value,
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
              onClick={close}
            >
              {resultCount}点を見る
            </Button>
          </div>
        </>
      )}
    </FilterFabShell>
  );
}
