import { describe, expect, it } from "vitest";

import {
  buildTasteProfile,
  describeTaste,
  rankProducts,
  scoreProduct,
  type TasteSignal,
} from "./taste";

function signal(overrides: Partial<TasteSignal> = {}): TasteSignal {
  return {
    direction: "like",
    category: "outerwear",
    brand: "ATELIER SUD",
    colors: ["Beige"],
    price: 620,
    ...overrides,
  };
}

describe("buildTasteProfile", () => {
  it("mengembalikan profil kosong tanpa sinyal", () => {
    const profile = buildTasteProfile([]);

    expect(profile.categories).toEqual([]);
    expect(profile.priceBand).toBeNull();
    expect(profile.confidence).toBe(0);
    expect(profile.totalSwipes).toBe(0);
  });

  it("memberi bobot super like tiga kali lipat suka biasa", () => {
    const profile = buildTasteProfile([
      signal({ direction: "super", category: "dresses" }),
      signal({ direction: "like", category: "tops" }),
    ]);

    const dresses = profile.categories.find((c) => c.key === "dresses");
    const tops = profile.categories.find((c) => c.key === "tops");

    // Puncaknya 3 (dresses), jadi tops ternormalisasi ke 1/3.
    expect(dresses?.score).toBe(1);
    expect(tops?.score).toBeCloseTo(1 / 3, 5);
  });

  it("mencatat swipe kiri sebagai afinitas negatif", () => {
    const profile = buildTasteProfile([
      signal({ direction: "like", category: "tops" }),
      signal({ direction: "pass", category: "bottoms" }),
    ]);

    expect(profile.categories.find((c) => c.key === "bottoms")!.score).toBeLessThan(0);
    expect(profile.passedCount).toBe(1);
    expect(profile.likedCount).toBe(1);
  });

  it("membangun rentang harga hanya dari yang disukai", () => {
    const profile = buildTasteProfile([
      signal({ direction: "like", price: 100 }),
      signal({ direction: "like", price: 300 }),
      // Harga ekstrem ini ditolak, jadi tidak boleh menggeser anggaran.
      signal({ direction: "pass", price: 5000 }),
    ]);

    expect(profile.priceBand).toEqual({ min: 100, max: 300, mid: 200 });
  });

  it("membagi bobot warna pada produk multi-warna", () => {
    const profile = buildTasteProfile([
      signal({ direction: "like", colors: ["Black", "White"] }),
    ]);

    // Keduanya dapat 0.5 mentah, lalu dinormalisasi ke puncak yang sama.
    expect(profile.colors.map((c) => c.key).sort()).toEqual(["Black", "White"]);
    expect(profile.colors[0].score).toBe(1);
  });

  it("menaikkan keyakinan seiring jumlah swipe dan berhenti di 1", () => {
    expect(buildTasteProfile([signal()]).confidence).toBeCloseTo(0.1, 5);
    expect(
      buildTasteProfile(Array.from({ length: 25 }, () => signal())).confidence,
    ).toBe(1);
  });
});

describe("scoreProduct", () => {
  it("menilai produk yang cocok lebih tinggi daripada yang ditolak", () => {
    const profile = buildTasteProfile([
      signal({ direction: "super", category: "outerwear", brand: "SUD" }),
      signal({ direction: "pass", category: "bottoms", brand: "DENIM CO" }),
    ]);

    const match = scoreProduct(profile, {
      category: "outerwear",
      brand: "SUD",
      colors: ["Beige"],
      price: 620,
    });
    const miss = scoreProduct(profile, {
      category: "bottoms",
      brand: "DENIM CO",
      colors: ["Blue"],
      price: 620,
    });

    expect(match).toBeGreaterThan(miss);
  });

  it("tidak jatuh saat produk tidak punya warna", () => {
    const profile = buildTasteProfile([signal()]);

    expect(
      scoreProduct(profile, {
        category: "outerwear",
        brand: "ATELIER SUD",
        colors: [],
        price: 620,
      }),
    ).toBeGreaterThan(0);
  });

  it("tidak membagi dengan nol saat baru satu harga disukai", () => {
    const profile = buildTasteProfile([signal({ price: 200 })]);

    const score = scoreProduct(profile, {
      category: "outerwear",
      brand: "ATELIER SUD",
      colors: ["Beige"],
      price: 200,
    });

    expect(Number.isFinite(score)).toBe(true);
  });
});

describe("rankProducts", () => {
  const catalogue = [
    { id: 1, category: "bottoms", brand: "DENIM CO", colors: ["Blue"], price: 180 },
    { id: 2, category: "outerwear", brand: "SUD", colors: ["Beige"], price: 620 },
    { id: 3, category: "tops", brand: "SUD", colors: ["White"], price: 140 },
  ];

  it("mempertahankan urutan asli saat belum ada swipe", () => {
    const profile = buildTasteProfile([]);

    expect(rankProducts(profile, catalogue).map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("menaikkan produk yang cocok dengan selera ke atas", () => {
    const profile = buildTasteProfile([
      signal({ direction: "super", category: "outerwear", brand: "SUD", colors: ["Beige"], price: 620 }),
    ]);

    expect(rankProducts(profile, catalogue)[0].id).toBe(2);
  });

  it("tidak mengubah array masukan", () => {
    const profile = buildTasteProfile([signal()]);
    const input = [...catalogue];
    rankProducts(profile, input);

    expect(input.map((p) => p.id)).toEqual([1, 2, 3]);
  });
});

describe("describeTaste", () => {
  it("mengembalikan null sebelum ada yang disukai", () => {
    expect(describeTaste(buildTasteProfile([]))).toBeNull();
    expect(
      describeTaste(buildTasteProfile([signal({ direction: "pass" })])),
    ).toBeNull();
  });

  it("merangkai kategori, warna, dan brand teratas", () => {
    const profile = buildTasteProfile([
      signal({ direction: "super", category: "dresses", colors: ["Emerald"], brand: "MAISON" }),
    ]);

    expect(describeTaste(profile)).toBe("dresses in Emerald from MAISON");
  });
});
