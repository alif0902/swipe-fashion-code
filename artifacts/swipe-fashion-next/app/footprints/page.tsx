import type { Metadata } from "next";
import { Footprints } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { HistoryEmpty, HistoryList } from "@/components/history-list";
import { listSwipeHistory } from "@/lib/data";
import { getOwnerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "足あと｜SwipeFash",
  robots: { index: false, follow: false },
};

export default async function FootprintsPage() {
  const ownerId = await getOwnerId();
  const entries = await listSwipeHistory(ownerId);

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <PageHeader
          icon={Footprints}
          eyebrow="HISTORY"
          title="足あと"
          subtitle="フィードで判断した一着が、新しい順に並びます。"
          count={entries.length}
          countLabel="点"
        />

        {entries.length === 0 ? (
          <HistoryEmpty
            icon={Footprints}
            title="まだ足あとがありません。"
            body="フィードでスワイプすると、見た一着がここに残ります。"
          />
        ) : (
          <HistoryList entries={entries} />
        )}
      </div>
    </AppLayout>
  );
}
