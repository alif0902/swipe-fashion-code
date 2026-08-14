
export type FeedFilter = {
  gender?: "women" | "men";
  category?: string;
};

export const FEED_FILTER_COOKIE = "hitome_feed_filter";

const CATEGORY_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

function readGender(value: string | null): FeedFilter["gender"] {
  return value === "women" || value === "men" ? value : undefined;
}

function readCategory(value: string | null): string | undefined {
  return value && CATEGORY_PATTERN.test(value) ? value : undefined;
}

export function parseFeedFilter(raw: string | undefined): FeedFilter {
  if (!raw) return {};

  const params = new URLSearchParams(raw);

  const gender = readGender(params.get("gender"));
  const category = readCategory(params.get("category"));

  return {
    ...(gender ? { gender } : {}),
    ...(category ? { category } : {}),
  };
}

export function serializeFeedFilter(filter: FeedFilter): string {
  const params = new URLSearchParams();

  const gender = readGender(filter.gender ?? null);
  const category = readCategory(filter.category ?? null);

  if (gender) params.set("gender", gender);
  if (category) params.set("category", category);

  return params.toString();
}

export function countActiveFeedFilters(filter: FeedFilter): number {
  return (filter.gender ? 1 : 0) + (filter.category ? 1 : 0);
}
