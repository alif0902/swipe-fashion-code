import { describe, expect, it } from "vitest";

import {
  BOTTOMS,
  DRESSES,
  OUTERWEAR,
  TOPS,
  buildLooks,
  describeLookGap,
} from "./outfit";

const piece = (id: number, category: string) => ({ id, category });

describe("buildLooks", () => {
  it("tidak menghasilkan apa pun dari koleksi kosong", () => {
    expect(buildLooks([])).toEqual([]);
  });

  it("tidak menjadikan potongan tunggal sebagai look", () => {
    expect(buildLooks([piece(1, TOPS)])).toEqual([]);
    expect(buildLooks([piece(1, BOTTOMS)])).toEqual([]);
    // Luaran saja juga bukan outfit.
    expect(buildLooks([piece(1, OUTERWEAR)])).toEqual([]);
  });

  it("menjadikan dress sebagai alas yang sudah lengkap", () => {
    const looks = buildLooks([piece(1, DRESSES)]);

    expect(looks).toHaveLength(1);
    expect(looks[0].pieces.map((p) => p.id)).toEqual([1]);
  });

  it("memasangkan atasan dengan bawahan", () => {
    const looks = buildLooks([piece(5, BOTTOMS), piece(2, TOPS)]);

    expect(looks).toHaveLength(1);
    expect(looks[0].pieces.map((p) => p.id)).toEqual([2, 5]);
  });

  it("menumpuk luaran di atas alas yang lengkap", () => {
    const looks = buildLooks([
      piece(1, TOPS),
      piece(2, BOTTOMS),
      piece(3, OUTERWEAR),
    ]);

    expect(looks[0].pieces.map((p) => p.category)).toEqual([
      TOPS,
      BOTTOMS,
      OUTERWEAR,
    ]);
  });

  it("tidak memakai ulang satu potong di dua look", () => {
    const looks = buildLooks([
      piece(1, TOPS),
      piece(2, TOPS),
      piece(3, BOTTOMS),
      piece(4, BOTTOMS),
    ]);

    const used = looks.flatMap((l) => l.pieces.map((p) => p.id));
    expect(used).toHaveLength(new Set(used).size);
    expect(looks).toHaveLength(2);
  });

  it("mengabaikan atasan berlebih yang tidak kebagian bawahan", () => {
    const looks = buildLooks([
      piece(1, TOPS),
      piece(2, TOPS),
      piece(3, TOPS),
      piece(4, BOTTOMS),
    ]);

    expect(looks).toHaveLength(1);
  });

  it("deterministik terhadap urutan masukan", () => {
    const a = buildLooks([piece(3, BOTTOMS), piece(1, TOPS), piece(2, DRESSES)]);
    const b = buildLooks([piece(2, DRESSES), piece(1, TOPS), piece(3, BOTTOMS)]);

    expect(a).toEqual(b);
  });

  it("memberi id dan judul yang stabil", () => {
    const looks = buildLooks([piece(1, TOPS), piece(2, BOTTOMS)]);

    expect(looks[0].id).toBe("1-2");
    expect(looks[0].title).toBe("コーデ 01");
  });
});

describe("describeLookGap", () => {
  it("mengarahkan ke bawahan bila baru ada atasan", () => {
    expect(describeLookGap([piece(1, TOPS)])).toMatch(/ボトムス/);
  });

  it("mengarahkan ke atasan bila baru ada bawahan", () => {
    expect(describeLookGap([piece(1, BOTTOMS)])).toMatch(/トップス/);
  });

  it("memberi arahan umum saat koleksi kosong", () => {
    expect(describeLookGap([])).toMatch(/トップスとボトムス/);
  });

  it("diam saat look sudah bisa dirakit", () => {
    expect(describeLookGap([piece(1, DRESSES)])).toBeNull();
    expect(describeLookGap([piece(1, TOPS), piece(2, BOTTOMS)])).toBeNull();
  });
});
