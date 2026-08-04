import { describe, expect, it } from "vitest";

import {
  createOrderSchema,
  reviewSchema,
  emailSchema,
  passwordSchema,
  passwordStrength,
  signInSchema,
  signUpSchema,
} from "./validation";

describe("createOrderSchema", () => {
  it("accepts a well-formed order", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 1,
    });

    expect(result.success).toBe(true);
  });

  it("strips a sessionId supplied by the client", () => {
    const result = createOrderSchema.safeParse({
      sessionId: "someone-elses-session",
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect("sessionId" in result.data).toBe(false);
    }
  });

  it("rejects a quantity below one", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 0,
    });

    expect(result.success).toBe(false);
  });

  // Batas atas ditambahkan setelah audit. Sebelumnya satu-satunya penahan
  // adalah pemeriksaan stok di createOrderAction — kalau jalur itu berubah,
  // tidak ada lapis kedua yang menolak angka yang tidak masuk akal.
  it("rejects a quantity above the per-order maximum", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 100,
    });

    expect(result.success).toBe(false);
  });

  it("accepts the maximum quantity itself", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 99,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a fractional quantity", () => {
    const result = createOrderSchema.safeParse({
      productId: 3,
      selectedSize: "M",
      selectedColor: "Black",
      quantity: 1.5,
    });

    expect(result.success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts a normal address", () => {
    expect(emailSchema.safeParse("aliff@example.com").success).toBe(true);
  });

  it("rejects an address without a domain", () => {
    expect(emailSchema.safeParse("aliff@").success).toBe(false);
  });

  it("rejects an empty string with the dedicated message", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "メールアドレスを入力してください",
      );
    }
  });
});

describe("passwordSchema", () => {
  it("accepts eight characters mixing letters and digits", () => {
    expect(passwordSchema.safeParse("swipe123").success).toBe(true);
  });

  it("rejects seven characters", () => {
    expect(passwordSchema.safeParse("swipe12").success).toBe(false);
  });

  it("rejects letters only", () => {
    expect(passwordSchema.safeParse("swipefash").success).toBe(false);
  });

  it("rejects digits only", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("rejects a password past the hashing-cost ceiling", () => {
    expect(passwordSchema.safeParse(`a1${"x".repeat(200)}`).success).toBe(false);
  });
});

describe("signInSchema", () => {
  // Sengaja longgar: memperketat aturan password nanti tidak boleh mengunci
  // pemilik akun lama di luar.
  it("accepts a weak password that signUp would reject", () => {
    const weak = { email: "aliff@example.com", password: "old" };

    expect(signInSchema.safeParse(weak).success).toBe(true);
    expect(
      signUpSchema.safeParse({ ...weak, name: "aliff" }).success,
    ).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("scores anything below the minimum length as zero", () => {
    expect(passwordStrength("a1")).toBe(0);
    expect(passwordStrength("swipe12")).toBe(0);
  });

  it("scores a bare valid password as one", () => {
    expect(passwordStrength("swipe123")).toBe(1);
  });

  it("adds a point for length and another for a symbol", () => {
    expect(passwordStrength("swipefash1234")).toBe(2);
    expect(passwordStrength("swipefash123!")).toBe(3);
  });

  it("never exceeds three", () => {
    expect(passwordStrength(`${"swipefash123!".repeat(4)}`)).toBe(3);
  });
});

// --- Ulasan produk ---------------------------------------------------------

describe("reviewSchema", () => {
  const valid = {
    productId: 1,
    rating: 5,
    authorName: "みなみ",
    body: "サイズ感がちょうどよかったです。",
  };

  it("menerima ulasan yang wajar", () => {
    expect(reviewSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak rating di luar 1–5", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it("menolak rating pecahan", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 4.5 }).success).toBe(false);
  });

  it("menolak isi yang terlalu pendek", () => {
    expect(reviewSchema.safeParse({ ...valid, body: "いいね" }).success).toBe(false);
  });

  it("menolak isi yang hanya spasi", () => {
    // Ini yang menentukan apakah .trim() benar-benar berlaku SEBELUM .min().
    // Kalau tidak, 20 spasi lolos batas 10 karakter dan daftar ulasan bisa
    // diisi baris kosong.
    expect(
      reviewSchema.safeParse({ ...valid, body: " ".repeat(20) }).success,
    ).toBe(false);
  });

  it("menolak nama yang hanya spasi", () => {
    expect(
      reviewSchema.safeParse({ ...valid, authorName: "   " }).success,
    ).toBe(false);
  });

  it("menolak isi melebihi 500 karakter", () => {
    expect(
      reviewSchema.safeParse({ ...valid, body: "あ".repeat(501) }).success,
    ).toBe(false);
  });

  it("membuang spasi di tepi nama dan isi", () => {
    const parsed = reviewSchema.parse({
      ...valid,
      authorName: "  みなみ  ",
      body: "  サイズ感がちょうどよかったです。  ",
    });
    expect(parsed.authorName).toBe("みなみ");
    expect(parsed.body).toBe("サイズ感がちょうどよかったです。");
  });
});
