import { AppLayout } from "@/components/layout";
import { SwipeFeed } from "@/components/swipe-feed";
import { listProducts } from "@/lib/data";
import { getOwnerId } from "@/lib/session";

// Stok, katalog, dan boost "Obsessed" berubah antar sesi/aksi, jadi feed
// tidak boleh di-cache statis saat build.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const sessionId = await getOwnerId();
  // rankByTaste: inilah satu-satunya tempat mesin selera menentukan urutan.
  // 探す memakai pilihan 並び替え biasa.
  const products = await listProducts({
    limit: 10,
    sessionId,
    rankByTaste: true,
  });

  return (
    <AppLayout>
      <SwipeFeed products={products} />
    </AppLayout>
  );
}
