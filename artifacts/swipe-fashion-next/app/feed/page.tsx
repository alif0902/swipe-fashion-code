import { AppLayout } from "@/components/layout";
import { SwipeFeed } from "@/components/swipe-feed";
import { listProducts } from "@/lib/data";
import { getOwnerId } from "@/lib/session";

// Stok, katalog, dan boost "Obsessed" berubah antar sesi/aksi, jadi feed
// tidak boleh di-cache statis saat build.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const sessionId = await getOwnerId();
  const products = await listProducts({ limit: 10, sessionId });

  return (
    <AppLayout>
      <SwipeFeed products={products} />
    </AppLayout>
  );
}
