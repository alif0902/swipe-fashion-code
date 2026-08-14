import { describe, expect, it } from "vitest";

import {
  formatAddress,
  formatProduct,
  hasCompleteAddress,
  safeImage,
} from "./format";

const row = {
  id: 1,
  name: "Camel Wool Overcoat",
  brand: "ATELIER SUD",
  price: "620.00",
  originalPrice: null,
  description: "Double-faced wool.",
  imageUrl: "/assets/placeholder.jpg",
  images: [],
  category: "outerwear",
  gender: "women" as const,
  sizes: ["S", "M"],
  colors: ["Beige"],
  material: "ウール100%",
  feel: "肩に置くだけで、背筋が伸びる。",
  dimensions: { "着丈": "110cm" },
  stock: 5,
  rating: "4.90",
  reviewCount: 87,
  isNew: true,
  isSale: false,
  createdAt: new Date("2026-01-01"),
};

describe("formatProduct", () => {
  it("converts numeric columns from string to number", () => {
    const product = formatProduct(row);

    expect(product.price).toBe(620);
    expect(product.rating).toBe(4.9);
    expect(typeof product.price).toBe("number");
  });

  it("keeps null numerics as null instead of NaN", () => {
    const product = formatProduct(row);

    expect(product.originalPrice).toBeNull();
  });

  it("survives .toFixed(2), which the UI calls on every price", () => {
    const product = formatProduct(row);

    expect(product.price.toFixed(2)).toBe("620.00");
  });
});

describe("formatAddress", () => {
  const full = {
    postalCode: "755-0096",
    prefecture: "山口県",
    city: "宇部市",
    address: "開5丁目2-21-3",
    building: "コーポ石川 12号室",
  };

  it("writes the parts largest-first, the Japanese order", () => {
    expect(formatAddress(full)).toBe(
      "〒755-0096 山口県 宇部市 開5丁目2-21-3 コーポ石川 12号室",
    );
  });

  it("skips the building when there is none", () => {
    expect(formatAddress({ ...full, building: null })).toBe(
      "〒755-0096 山口県 宇部市 開5丁目2-21-3",
    );
  });

  it("leaves no dangling separators when parts are missing", () => {
    expect(formatAddress({ prefecture: "東京都", city: "渋谷区" })).toBe(
      "東京都 渋谷区",
    );
  });

  it("returns an empty string when nothing is filled in", () => {
    expect(formatAddress({})).toBe("");
  });
});

describe("hasCompleteAddress", () => {
  it("needs prefecture, city and street together", () => {
    expect(
      hasCompleteAddress({
        prefecture: "山口県",
        city: "宇部市",
        address: "開5丁目2-21-3",
      }),
    ).toBe(true);
  });

  it("rejects a postal code on its own", () => {
    expect(hasCompleteAddress({ postalCode: "755-0096" })).toBe(false);
  });

  it("rejects a missing street even with prefecture and city", () => {
    expect(
      hasCompleteAddress({ prefecture: "山口県", city: "宇部市" }),
    ).toBe(false);
  });
});

describe("safeImage", () => {
  it("falls back when the source is empty, which next/image rejects", () => {
    expect(safeImage("")).toBe("/assets/placeholder.jpg");
    expect(safeImage(null)).toBe("/assets/placeholder.jpg");
    expect(safeImage(undefined)).toBe("/assets/placeholder.jpg");
  });

  it("passes a real path through untouched", () => {
    expect(safeImage("/assets/polo-cotton.webp")).toBe(
      "/assets/polo-cotton.webp",
    );
  });
});
