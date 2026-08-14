import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { ObsessedGrid } from "@/components/obsessed-grid";
import { listObsessed } from "@/lib/data";
import { getOwnerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "一目惚れ｜HITOME",
  description: "「いいね！」した一着を、いつでも見返せます。",
};

export default async function ObsessedPage() {
  const sessionId = await getOwnerId();
  const products = await listObsessed(sessionId);

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-28">
        <PageHeader
          icon={Star}
          eyebrow="SUPER LIKE"
          title="一目惚れ"
          subtitle="フィードはこの好みに寄っていきます。"
          count={products.length}
          countLabel="点"
        />

        {products.length > 0 ? (
          <div className="px-4 pt-2 pb-10">
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
