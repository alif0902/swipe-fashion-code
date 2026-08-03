import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Package, ShoppingBag, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { getAdminSummary, getProductPerformance } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="font-sans font-bold text-3xl tabular-nums leading-none">
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [summary, performance] = await Promise.all([
    getAdminSummary(),
    getProductPerformance(),
  ]);

  // Diurutkan dari yang paling sering ditolak. Ini urutan yang paling berguna:
  // produk teratas di daftar ini adalah yang paling perlu diputuskan nasibnya.
  const ranked = [...performance].sort((a, b) => {
    if (a.likeRate === null) return 1;
    if (b.likeRate === null) return -1;
    return a.likeRate - b.likeRate;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sans font-bold text-2xl">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground mt-1">
          スワイプの記録から集計しています。
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Package}
          label="商品"
          value={String(summary.products)}
        />
        <SummaryCard icon={Users} label="登録ユーザー" value={String(summary.users)} />
        <SummaryCard
          icon={Zap}
          label="スワイプ"
          value={String(summary.swipes)}
          hint="左スワイプも記録しています"
        />
        <SummaryCard
          icon={ShoppingBag}
          label="お支払い済み"
          value={formatPrice(summary.revenue)}
          hint={`注文 ${summary.orders}件`}
        />
      </div>

      <section className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-sans font-bold">商品ごとの反応</h2>
          {/* Bagian yang paling layak ditunjukkan. Toko biasa hanya tahu apa
              yang dibeli; ini tahu apa yang dilihat lalu dilewati. */}
          <p className="text-xs text-muted-foreground mt-1">
            見送られた回数が多い順。買われなかった理由は、売上表には出てきません。
          </p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3">商品</th>
              <th className="text-right font-medium px-3 py-3">いいね</th>
              <th className="text-right font-medium px-3 py-3">見送り</th>
              <th className="text-right font-medium px-3 py-3">一目惚れ</th>
              <th className="text-right font-medium px-3 py-3">注文</th>
              <th className="text-right font-medium px-5 py-3 w-40">いいね率</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/products/${row.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="relative w-10 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={row.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {row.brand}
                      </span>
                      <span className="flex items-center gap-1 font-medium truncate">
                        {row.name}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition" />
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{row.likes}</td>
                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                  {row.passes}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{row.supers}</td>
                <td className="px-3 py-3 text-right tabular-nums font-bold">
                  {row.orders}
                </td>
                <td className="px-5 py-3">
                  {row.likeRate === null ? (
                    <span className="text-xs text-muted-foreground block text-right">
                      データなし
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-24">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            row.likeRate < 0.3 ? "bg-muted-foreground/50" : "bg-primary",
                          )}
                          style={{ width: `${Math.round(row.likeRate * 100)}%` }}
                        />
                      </span>
                      <span className="w-10 text-right tabular-nums text-xs">
                        {Math.round(row.likeRate * 100)}%
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
