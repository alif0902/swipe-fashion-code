import { describe, expect, it } from "vitest";

import {
  countActiveFeedFilters,
  parseFeedFilter,
  serializeFeedFilter,
} from "./feed-filter";

describe("parseFeedFilter", () => {
  it("mengembalikan filter kosong kalau cookie belum ada", () => {
    expect(parseFeedFilter(undefined)).toEqual({});
    expect(parseFeedFilter("")).toEqual({});
  });

  it("membaca gender dan kategori", () => {
    expect(parseFeedFilter("gender=men&category=tops")).toEqual({
      gender: "men",
      category: "tops",
    });
  });

  it("membaca salah satu saja", () => {
    expect(parseFeedFilter("gender=women")).toEqual({ gender: "women" });
    expect(parseFeedFilter("category=outerwear")).toEqual({
      category: "outerwear",
    });
  });

  // Cookie bisa disunting siapa saja lewat devtools. Nilai yang tidak dikenal
  // dibuang, bukan diteruskan ke query.
  it("membuang gender yang tidak dikenal", () => {
    expect(parseFeedFilter("gender=alien")).toEqual({});
    expect(parseFeedFilter("gender=MEN")).toEqual({});
    expect(parseFeedFilter("gender=men&category=tops&gender=x")).toEqual({
      gender: "men",
      category: "tops",
    });
  });

  it("membuang kategori yang bentuknya bukan slug", () => {
    expect(parseFeedFilter("category=<script>alert(1)</script>")).toEqual({});
    expect(parseFeedFilter("category=TOPS")).toEqual({});
    expect(parseFeedFilter("category=")).toEqual({});
    expect(parseFeedFilter("category=1tops")).toEqual({});
    expect(parseFeedFilter(`category=${"a".repeat(33)}`)).toEqual({});
  });

  it("menerima slug bertanda hubung dan berangka", () => {
    expect(parseFeedFilter("category=one-piece2")).toEqual({
      category: "one-piece2",
    });
  });

  it("mengabaikan kunci lain yang menumpang di cookie", () => {
    expect(parseFeedFilter("gender=men&sort=price-asc&stock=1")).toEqual({
      gender: "men",
    });
  });

  it("tidak meledak pada isi yang sama sekali bukan pasangan kunci-nilai", () => {
    expect(parseFeedFilter("%%%")).toEqual({});
  });
});

describe("serializeFeedFilter", () => {
  it("menghasilkan string kosong untuk filter kosong", () => {
    expect(serializeFeedFilter({})).toBe("");
  });

  it("hanya menulis bagian yang terisi", () => {
    expect(serializeFeedFilter({ gender: "men" })).toBe("gender=men");
    expect(serializeFeedFilter({ category: "tops" })).toBe("category=tops");
  });

  it("bolak-balik tanpa kehilangan apa pun", () => {
    const filter = { gender: "women", category: "dresses" } as const;
    expect(parseFeedFilter(serializeFeedFilter(filter))).toEqual(filter);
  });

  // Titik masuk kedua selain cookie: nilai dari klien lewat Server Action.
  // Membersihkannya di sini berarti pemanggil cukup melakukan serialize lalu
  // parse untuk mendapat nilai yang sudah aman.
  it("membuang nilai yang tidak sah, bukan menuliskannya", () => {
    expect(
      serializeFeedFilter({
        gender: "pria" as never,
        category: "TOPS",
      }),
    ).toBe("");
  });
});

describe("countActiveFeedFilters", () => {
  it("menghitung hanya yang terisi", () => {
    expect(countActiveFeedFilters({})).toBe(0);
    expect(countActiveFeedFilters({ gender: "men" })).toBe(1);
    expect(countActiveFeedFilters({ gender: "men", category: "tops" })).toBe(2);
  });
});
