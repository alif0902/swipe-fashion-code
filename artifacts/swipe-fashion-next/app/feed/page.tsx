import { cookies } from "next/headers";

import { AppLayout } from "@/components/layout";
import { FeedFilterFab } from "@/components/feed-filter-fab";
import { SwipeFeed } from "@/components/swipe-feed";
import { listCategories, listProducts } from "@/lib/data";
import {
  FEED_FILTER_COOKIE,
  countActiveFeedFilters,
  parseFeedFilter,
} from "@/lib/feed-filter";
import { getOwnerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const [sessionId, cookieStore] = await Promise.all([getOwnerId(), cookies()]);

  const filter = parseFeedFilter(cookieStore.get(FEED_FILTER_COOKIE)?.value);

  const [products, categories] = await Promise.all([
    listProducts({
      limit: 10,
      sessionId,
      rankByTaste: true,
      gender: filter.gender,
      category: filter.category,
    }),
    listCategories(),
  ]);

  return (
    <AppLayout
      overlay={<FeedFilterFab filter={filter} categories={categories} />}
    >
      <SwipeFeed
        key={`${filter.gender ?? ""}-${filter.category ?? ""}`}
        products={products}
        isFiltered={countActiveFeedFilters(filter) > 0}
      />
    </AppLayout>
  );
}
