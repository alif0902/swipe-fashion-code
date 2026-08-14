import { describe, expect, it } from "vitest";

import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  konbiniNumber,
  luhnCheck,
  paymentLabel,
  validateCard,
} from "./payment";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("detectCardBrand", () => {
  it("mengenali penerbit dari awalan nomor", () => {
    expect(detectCardBrand("4242424242424242")).toBe("visa");
    expect(detectCardBrand("5555555555554444")).toBe("mastercard");
    expect(detectCardBrand("3530111333300000")).toBe("jcb");
    expect(detectCardBrand("378282246310005")).toBe("amex");
    expect(detectCardBrand("36227206271667")).toBe("diners");
  });

  it("mengenali Mastercard rentang 2221–2720", () => {
    expect(detectCardBrand("2221000000000009")).toBe("mastercard");
    expect(detectCardBrand("2720990000000000")).toBe("mastercard");
  });

  it("mengembalikan unknown untuk masukan kosong atau asing", () => {
    expect(detectCardBrand("")).toBe("unknown");
    expect(detectCardBrand("9999")).toBe("unknown");
  });
});

describe("formatCardNumber", () => {
  it("mengelompokkan per 4 untuk kartu biasa", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
  });

  it("memakai pola 4-6-5 untuk AMEX", () => {
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
  });

  it("memotong digit berlebih sesuai panjang penerbit", () => {
    expect(formatCardNumber("42424242424242429999")).toBe("4242 4242 4242 4242");
  });

  it("mengabaikan karakter bukan angka", () => {
    expect(formatCardNumber("4242-4242 4242_4242")).toBe("4242 4242 4242 4242");
  });
});

describe("formatExpiry", () => {
  it("menyisipkan garis miring", () => {
    expect(formatExpiry("1230")).toBe("12/30");
  });

  it("menambah nol di depan untuk bulan satu digit", () => {
    expect(formatExpiry("530")).toBe("05/30");
  });

  it("membiarkan masukan yang belum lengkap", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
  });
});

describe("luhnCheck", () => {
  it("menerima nomor uji yang sah", () => {
    expect(luhnCheck("4242424242424242")).toBe(true);
    expect(luhnCheck("378282246310005")).toBe(true);
  });

  it("menolak salah ketik satu digit", () => {
    expect(luhnCheck("4242424242424243")).toBe(false);
  });

  it("menolak nomor yang terlalu pendek", () => {
    expect(luhnCheck("4242")).toBe(false);
  });
});

describe("isExpiryValid", () => {
  it("menerima bulan yang masih akan datang", () => {
    expect(isExpiryValid("1230", NOW)).toBe(true);
  });

  it("sah sampai akhir bulan yang tertera", () => {
    expect(isExpiryValid("0726", NOW)).toBe(true);
    expect(isExpiryValid("0626", NOW)).toBe(false);
  });

  it("menolak bulan di luar 1–12", () => {
    expect(isExpiryValid("1330", NOW)).toBe(false);
    expect(isExpiryValid("0030", NOW)).toBe(false);
  });
});

describe("validateCard", () => {
  const valid = {
    number: "4242 4242 4242 4242",
    expiry: "12/30",
    cvc: "123",
    holder: "TARO YAMADA",
  };

  it("tidak mengeluh pada masukan yang benar", () => {
    expect(validateCard(valid, NOW)).toEqual({});
  });

  it("menuntut 4 digit CVC untuk AMEX", () => {
    const amex = { ...valid, number: "3782 822463 10005", cvc: "123" };
    expect(validateCard(amex, NOW).cvc).toBeTruthy();
    expect(validateCard({ ...amex, cvc: "1234" }, NOW).cvc).toBeUndefined();
  });

  it("menandai kartu kedaluwarsa", () => {
    expect(validateCard({ ...valid, expiry: "01/20" }, NOW).expiry).toBeTruthy();
  });

  it("menandai nomor yang gagal Luhn", () => {
    expect(
      validateCard({ ...valid, number: "4242 4242 4242 4243" }, NOW).number,
    ).toBeTruthy();
  });

  it("menuntut nama pemegang kartu", () => {
    expect(validateCard({ ...valid, holder: " " }, NOW).holder).toBeTruthy();
  });
});

describe("paymentLabel", () => {
  it("menyertakan penerbit dan hanya 4 digit terakhir", () => {
    expect(paymentLabel("card", "4242 4242 4242 4242")).toBe(
      "クレジットカード（Visa •••• 4242）",
    );
  });

  it("tidak pernah membocorkan nomor lengkap", () => {
    const label = paymentLabel("card", "4242 4242 4242 4242");
    expect(label).not.toContain("4242 4242 4242");
  });

  it("memakai label polos untuk metode tanpa kartu", () => {
    expect(paymentLabel("paypay")).toBe("PayPay");
    expect(paymentLabel("konbini")).toBe("コンビニ払い");
  });
});

describe("konbiniNumber", () => {
  it("stabil untuk pesanan yang sama", () => {
    expect(konbiniNumber(42)).toBe(konbiniNumber(42));
  });

  it("berbeda antar pesanan", () => {
    expect(konbiniNumber(1)).not.toBe(konbiniNumber(2));
  });
});
