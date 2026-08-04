import { describe, expect, it } from "vitest";

import {
  buildTasteProfile,
  RECENT_WINDOW,
  describeTaste,
  explainRanking,
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
    // 1 dari RECENT_WINDOW (5) = 0,2. Dulu 0,1 saat ambangnya 10 swipe —
    // angka yang kini mustahil dicapai, karena profil tidak pernah membaca
    // lebih dari 5 sinyal.
    expect(buildTasteProfile([signal()]).confidence).toBeCloseTo(0.2, 5);
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

  it("merangkai kategori, warna, dan brand teratas dalam tata bahasa Jepang", () => {
    const profile = buildTasteProfile([
      signal({ direction: "super", category: "dresses", colors: ["Emerald"], brand: "MAISON" }),
    ]);

    expect(describeTaste(profile)).toBe("Emeraldのワンピース（MAISON）");
  });

  it("menghilangkan bagian yang tidak diketahui tanpa menyisakan partikel menggantung", () => {
    const tanpaWarna = buildTasteProfile([
      signal({ direction: "like", category: "tops", colors: [], brand: "CORSO" }),
    ]);
    expect(describeTaste(tanpaWarna)).toBe("トップス（CORSO）");
  });

  it("memakai label Jepang untuk kategori, bukan slug database", () => {
    const profile = buildTasteProfile([
      signal({ direction: "like", category: "outerwear", colors: [], brand: "" }),
    ]);

    expect(describeTaste(profile)).toBe("アウター");
  });
});

describe("explainRanking", () => {
  const outer = {
    category: "outerwear",
    brand: "CORSO",
    colors: ["White"],
    price: 59_200,
  };

  it("says nothing before there is any data to explain", () => {
    const empty = buildTasteProfile([]);
    expect(explainRanking(empty, outer)).toBeNull();
  });

  it("names the category when that is what drives the score", () => {
    const profile = buildTasteProfile([
      { direction: "super", category: "outerwear", brand: "NORD", colors: ["Grey"], price: 40_000 },
      { direction: "like", category: "outerwear", brand: "NORD", colors: ["Grey"], price: 42_000 },
    ]);

    expect(explainRanking(profile, outer)).toBe("アウターをよく選ぶから");
  });

  it("names the brand when the brand signal is the strongest", () => {
    const profile = buildTasteProfile([
      { direction: "super", category: "tops", brand: "CORSO", colors: ["Black"], price: 20_000 },
      { direction: "like", category: "tops", brand: "CORSO", colors: ["Black"], price: 21_000 },
    ]);

    expect(explainRanking(profile, outer)).toBe("CORSOが好みだから");
  });

  // Kejujuran ini yang menjaga fiturnya berguna: produk yang justru melawan
  // selera tidak boleh dijelaskan seolah-olah disukai.
  it("admits when an item runs against the recorded taste", () => {
    const profile = buildTasteProfile([
      { direction: "pass", category: "outerwear", brand: "CORSO", colors: ["White"], price: 59_200 },
      { direction: "pass", category: "outerwear", brand: "CORSO", colors: ["White"], price: 58_000 },
    ]);

    expect(explainRanking(profile, outer)).toBe("好みからは少し外れています");
  });
});

// --- Jendela swipe terbaru -------------------------------------------------

describe("RECENT_WINDOW", () => {
  it("hanya membaca RECENT_WINDOW sinyal pertama", () => {
    // Sinyal datang TERBARU DULU. Lima pertama semuanya アウター; sisanya
    // トップス dan harus diabaikan sepenuhnya.
    const profile = buildTasteProfile([
      ...Array.from({ length: RECENT_WINDOW }, () =>
        signal({ category: "outerwear" }),
      ),
      ...Array.from({ length: 20 }, () => signal({ category: "tops" })),
    ]);

    expect(profile.categories.map((c) => c.key)).toEqual(["outerwear"]);
  });

  it("melupakan selera lama saat yang baru masuk", () => {
    const lama = Array.from({ length: 10 }, () =>
      signal({ category: "dresses" }),
    );
    const baru = Array.from({ length: RECENT_WINDOW }, () =>
      signal({ category: "bottoms" }),
    );

    const profile = buildTasteProfile([...baru, ...lama]);
    expect(profile.categories[0].key).toBe("bottoms");
    expect(profile.categories.some((c) => c.key === "dresses")).toBe(false);
  });

  it("tetap menghitung SELURUH riwayat untuk angka マイページ", () => {
    // Jendela hanya membatasi SELERA. Kalau hitungannya ikut dipotong, orang
    // yang sudah menggeser 30 kali akan melihat "5" di 足あと.
    const profile = buildTasteProfile([
      ...Array.from({ length: 20 }, () => signal({ direction: "like" })),
      ...Array.from({ length: 10 }, () => signal({ direction: "pass" })),
    ]);

    expect(profile.totalSwipes).toBe(30);
    expect(profile.likedCount).toBe(20);
    expect(profile.passedCount).toBe(10);
  });

  it("likedCount dan passedCount selalu berjumlah totalSwipes", () => {
    const profile = buildTasteProfile([
      signal({ direction: "super" }),
      signal({ direction: "like" }),
      signal({ direction: "pass" }),
      signal({ direction: "pass" }),
      signal({ direction: "like" }),
      signal({ direction: "pass" }),
      signal({ direction: "super" }),
    ]);

    expect(profile.likedCount + profile.passedCount).toBe(profile.totalSwipes);
  });

  it("rentang harga hanya dari yang disukai DI DALAM jendela", () => {
    const profile = buildTasteProfile([
      // Di dalam jendela
      signal({ direction: "like", price: 100 }),
      signal({ direction: "like", price: 200 }),
      signal({ direction: "pass", price: 9999 }),
      signal({ direction: "like", price: 300 }),
      signal({ direction: "like", price: 400 }),
      // Di luar jendela — tidak boleh menggeser rentang
      signal({ direction: "like", price: 100000 }),
    ]);

    expect(profile.priceBand).not.toBeNull();
    expect(profile.priceBand!.max).toBe(400);
  });

  it("mencapai keyakinan penuh tepat saat jendela terisi", () => {
    const penuh = buildTasteProfile(
      Array.from({ length: RECENT_WINDOW }, () => signal()),
    );
    expect(penuh.confidence).toBe(1);

    const separuh = buildTasteProfile(
      Array.from({ length: Math.floor(RECENT_WINDOW / 2) }, () => signal()),
    );
    expect(separuh.confidence).toBeLessThan(1);
  });
});
