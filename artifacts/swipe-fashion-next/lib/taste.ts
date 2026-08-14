
import { categoryLabel } from "./format";

export type SwipeDirection = "pass" | "like" | "super";

export type TasteSignal = {
  direction: SwipeDirection;
  category: string;
  brand: string;
  colors: string[];
  price: number;
};

export type Affinity = {
  key: string;
  score: number;
};

export type PriceBand = { min: number; max: number; mid: number };

export type TasteProfile = {
  categories: Affinity[];
  brands: Affinity[];
  colors: Affinity[];
  priceBand: PriceBand | null;
  totalSwipes: number;
  likedCount: number;
  passedCount: number;
  confidence: number;
};

const DIRECTION_WEIGHT: Record<SwipeDirection, number> = {
  super: 3,
  like: 1,
  pass: -1,
};

export const RECENT_WINDOW = 5;

const CONFIDENCE_FULL_AT = RECENT_WINDOW;

const DIMENSION_WEIGHT = {
  category: 3,
  brand: 2,
  color: 1.5,
  price: 1,
} as const;

function tally(
  entries: Array<{ key: string; weight: number }>,
): Affinity[] {
  const raw = new Map<string, number>();
  for (const { key, weight } of entries) {
    if (!key) continue;
    raw.set(key, (raw.get(key) ?? 0) + weight);
  }

  if (raw.size === 0) return [];

  let peak = 0;
  for (const value of raw.values()) {
    peak = Math.max(peak, Math.abs(value));
  }
  if (peak === 0) return [];

  return [...raw.entries()]
    .map(([key, value]) => ({ key, score: value / peak }))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}

export function buildTasteProfile(allSignals: TasteSignal[]): TasteProfile {
  const signals = allSignals.slice(0, RECENT_WINDOW);

  const categoryEntries: Array<{ key: string; weight: number }> = [];
  const brandEntries: Array<{ key: string; weight: number }> = [];
  const colorEntries: Array<{ key: string; weight: number }> = [];
  const likedPrices: number[] = [];

  let likedCount = 0;
  let passedCount = 0;
  for (const signal of allSignals) {
    if (DIRECTION_WEIGHT[signal.direction] > 0) likedCount += 1;
    else passedCount += 1;
  }

  for (const signal of signals) {
    const weight = DIRECTION_WEIGHT[signal.direction];

    categoryEntries.push({ key: signal.category, weight });
    brandEntries.push({ key: signal.brand, weight });
    for (const color of signal.colors) {
      colorEntries.push({ key: color, weight: weight / signal.colors.length });
    }

    if (weight > 0 && Number.isFinite(signal.price)) {
      likedPrices.push(signal.price);
    }
  }

  let priceBand: PriceBand | null = null;
  if (likedPrices.length > 0) {
    const min = Math.min(...likedPrices);
    const max = Math.max(...likedPrices);
    const mid = likedPrices.reduce((sum, p) => sum + p, 0) / likedPrices.length;
    priceBand = { min, max, mid };
  }

  return {
    categories: tally(categoryEntries),
    brands: tally(brandEntries),
    colors: tally(colorEntries),
    priceBand,
    totalSwipes: allSignals.length,
    likedCount,
    passedCount,
    confidence: Math.min(1, signals.length / CONFIDENCE_FULL_AT),
  };
}

function affinityOf(list: Affinity[], key: string): number {
  return list.find((a) => a.key === key)?.score ?? 0;
}

export type ScorableProduct = {
  category: string;
  brand: string;
  colors: string[];
  price: number;
};

export function scoreProduct(
  profile: TasteProfile,
  product: ScorableProduct,
): number {
  let score = 0;

  score += DIMENSION_WEIGHT.category * affinityOf(profile.categories, product.category);
  score += DIMENSION_WEIGHT.brand * affinityOf(profile.brands, product.brand);

  if (product.colors.length > 0) {
    const colorAffinity =
      product.colors.reduce((sum, c) => sum + affinityOf(profile.colors, c), 0) /
      product.colors.length;
    score += DIMENSION_WEIGHT.color * colorAffinity;
  }

  if (profile.priceBand) {
    const { min, max, mid } = profile.priceBand;
    const spread = Math.max(max - min, mid * 0.5, 1);
    const distance = Math.abs(product.price - mid) / spread;
    score += DIMENSION_WEIGHT.price * (1 - Math.min(distance, 2));
  }

  return score;
}

export function rankProducts<T extends ScorableProduct>(
  profile: TasteProfile,
  products: T[],
): T[] {
  if (profile.totalSwipes === 0) return [...products];

  return [...products].sort(
    (a, b) => scoreProduct(profile, b) - scoreProduct(profile, a),
  );
}

export function describeTaste(profile: TasteProfile): string | null {
  if (profile.likedCount === 0) return null;

  const topCategory = profile.categories.find((a) => a.score > 0)?.key;
  const topColor = profile.colors.find((a) => a.score > 0)?.key;
  const topBrand = profile.brands.find((a) => a.score > 0)?.key;

  if (!topCategory && !topColor && !topBrand) return null;

  const noun = topCategory ? categoryLabel(topCategory) : "アイテム";
  const base = topColor ? `${topColor}の${noun}` : noun;

  return topBrand ? `${base}（${topBrand}）` : base;
}

export function explainRanking(
  profile: TasteProfile,
  product: ScorableProduct,
): string | null {
  if (profile.totalSwipes === 0) return null;

  const categoryScore =
    DIMENSION_WEIGHT.category * affinityOf(profile.categories, product.category);
  const brandScore =
    DIMENSION_WEIGHT.brand * affinityOf(profile.brands, product.brand);

  const colorAffinity =
    product.colors.length > 0
      ? product.colors.reduce((sum, c) => sum + affinityOf(profile.colors, c), 0) /
        product.colors.length
      : 0;
  const colorScore = DIMENSION_WEIGHT.color * colorAffinity;

  let priceScore = 0;
  if (profile.priceBand) {
    const { min, max, mid } = profile.priceBand;
    const spread = Math.max(max - min, mid * 0.5, 1);
    const distance = Math.abs(product.price - mid) / spread;
    priceScore = DIMENSION_WEIGHT.price * (1 - Math.min(distance, 2));
  }

  const reasons: { score: number; text: string }[] = [
    { score: categoryScore, text: `${categoryLabel(product.category)}をよく選ぶから` },
    { score: brandScore, text: `${product.brand}が好みだから` },
    { score: colorScore, text: `${product.colors[0] ?? ""}系が好みだから` },
    { score: priceScore, text: "好みの価格帯だから" },
  ];

  const best = reasons.reduce((a, b) => (b.score > a.score ? b : a));

  if (best.score <= 0) return "好みからは少し外れています";

  return best.text;
}
