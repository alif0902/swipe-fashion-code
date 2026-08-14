import { describe, expect, it } from "vitest";

import { sizeChartFor } from "./size-chart";

describe("sizeChartFor", () => {
  it("hanya mengembalikan ukuran yang benar-benar dijual", () => {
    const rows = sizeChartFor("women", ["XS", "S", "M"]);
    expect(rows.map((r) => r.size)).toEqual(["XS", "S", "M"]);
  });

  it("mempertahankan urutan tabel, bukan urutan argumen", () => {
    const rows = sizeChartFor("men", ["L", "S", "XL", "M"]);
    expect(rows.map((r) => r.size)).toEqual(["S", "M", "L", "XL"]);
  });

  it("membedakan tabel pria dan wanita", () => {
    const w = sizeChartFor("women", ["M"])[0];
    const m = sizeChartFor("men", ["M"])[0];
    expect(w.height).not.toBe(m.height);
  });

  it("mengembalikan kosong untuk penamaan bebas", () => {
    expect(sizeChartFor("women", ["FREE", "36"])).toEqual([]);
  });

  it("mengembalikan kosong kalau produk tidak punya ukuran", () => {
    expect(sizeChartFor("men", [])).toEqual([]);
  });

  it("setiap baris punya tinggi, dada, dan pinggang", () => {
    for (const gender of ["women", "men"] as const) {
      for (const row of sizeChartFor(gender, ["XS", "S", "M", "L", "XL"])) {
        expect(row.height).toMatch(/\d+–\d+/);
        expect(row.chest).toMatch(/\d+–\d+/);
        expect(row.waist).toMatch(/\d+–\d+/);
      }
    }
  });
});
