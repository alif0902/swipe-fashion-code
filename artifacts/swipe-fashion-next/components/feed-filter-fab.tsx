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
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              <button
                type="button"
                disabled={isPending}
                onClick={() => apply({ ...filter, category: undefined })}
                className={cn(
                  "h-10 px-4 shrink-0 whitespace-nowrap rounded-full text-sm font-medium border transition",
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
                    "h-10 px-4 shrink-0 whitespace-nowrap rounded-full text-sm font-medium border transition",
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
