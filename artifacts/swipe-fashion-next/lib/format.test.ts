import { describe, expect, it } from "vitest";

import { formatProduct } from "./format";

const row = {
  id: 1,
  name: "Camel Wool Overcoat",
  brand: "ATELIER SUD",
  price: "620.00",
  originalPrice: null,
  description: "Double-faced wool.",
  imageUrl: "/assets/coat-camel.jpg",
  images: [],
  category: "outerwear",
  sizes: ["S", "M"],
  colors: ["Beige"],
  material: "ウール100%",
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
