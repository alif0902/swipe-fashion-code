import { AppLayout } from "@/components/layout";
import { SwipeFeed } from "@/components/swipe-feed";
import { listProducts } from "@/lib/data";

// Stok dan katalog berubah saat order dibuat, jadi feed tidak boleh
// di-cache statis saat build.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const products = await listProducts({ limit: 10 });

  return (
    <AppLayout>
      <SwipeFeed products={products} />
    </AppLayout>
  );
}
