import type { Metadata } from "next";
import { ThumbsUp } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { HistoryEmpty, HistoryList } from "@/components/history-list";
import { listSwipeHistory } from "@/lib/data";
import { getOwnerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "いいね！履歴｜HITOME",
  robots: { index: false, follow: false },
};

export default async function LikesPage() {
  const ownerId = await getOwnerId();
  const entries = await listSwipeHistory(ownerId, { likedOnly: true });

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-28">
        <PageHeader
          icon={ThumbsUp}
          eyebrow="LIKED"
          title="いいね！履歴"
          subtitle="気になった一着の記録。"
          count={entries.length}
          countLabel="点"
        />

        {entries.length === 0 ? (
          <HistoryEmpty
            icon={ThumbsUp}
            title="まだいいね！がありません。"
            body="気になる一着を右にスワイプすると、ここに集まります。"
          />
        ) : (
          <HistoryList entries={entries} />
        )}
      </div>
    </AppLayout>
  );
}
