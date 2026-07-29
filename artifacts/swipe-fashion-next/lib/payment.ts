// Logika pembayaran — MURNI, tanpa DB dan tanpa jaringan.
//
// PERINGATAN: ini simulasi untuk demo. Tidak ada uang yang berpindah, tidak ada
// panggilan ke penyedia pembayaran mana pun, dan nomor kartu TIDAK PERNAH
// disimpan ke database. Yang tersimpan di kolom orders.paymentMethod hanya
// label seperti "クレジットカード (Visa •••• 4242)". Empat digit terakhir aman
// ditampilkan; sisanya dibuang begitu formulir ditutup.
//
// Sengaja dipisah jadi modul murni supaya validasi kartu — bagian yang paling
// mudah salah diam-diam — bisa diuji unit tanpa merender apa pun.

export type PaymentMethodId =
  | "card"
  | "paypay"
  | "konbini"
  | "cod"
  | "applepay";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  caption: string;
  // Perlu langkah masukan tambahan setelah metode dipilih?
  needsDetail: boolean;
};

// Bauran metode mengikuti kebiasaan belanja daring di Jepang: kartu dan PayPay
// mendominasi, tapi コンビニ払い dan 代金引換 masih dipakai luas — keduanya
// hampir selalu ada di checkout toko Jepang.
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    label: "クレジットカード",
    caption: "Visa / Mastercard / JCB / AMEX",
    needsDetail: true,
  },
  {
    id: "paypay",
    label: "PayPay",
    caption: "アプリで QR を読み取って支払い",
    needsDetail: true,
  },
  {
    id: "konbini",
    label: "コンビニ払い",
    caption: "ローソン / ファミマ / セブン-イレブン",
    needsDetail: true,
  },
  {
    id: "applepay",
    label: "Apple Pay",
    caption: "端末の認証だけで完了",
    needsDetail: false,
  },
  {
    id: "cod",
    label: "代金引換",
    caption: "商品受け取り時に現金で支払い",
    needsDetail: false,
  },
];

export type CardBrand =
  | "visa"
  | "mastercard"
  | "jcb"
  | "amex"
  | "diners"
  | "discover"
  | "unknown";

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  jcb: "JCB",
  amex: "AMEX",
  diners: "Diners",
  discover: "Discover",
  unknown: "カード",
};

export function cardBrandLabel(brand: CardBrand): string {
  return BRAND_LABEL[brand];
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Menebak penerbit kartu dari awalan nomornya.
 *
 * JCB ikut didukung dan bukan pelengkap: di Jepang ia salah satu penerbit
 * terbesar, dan checkout yang menolaknya akan langsung terasa asing.
 */
export function detectCardBrand(value: string): CardBrand {
  const n = digitsOnly(value);
  if (!n) return "unknown";

  if (/^4/.test(n)) return "visa";
  if (/^(34|37)/.test(n)) return "amex";
  if (/^(36|38|30[0-5])/.test(n)) return "diners";
  if (/^(6011|65|64[4-9])/.test(n)) return "discover";
  if (/^35(2[89]|[3-8][0-9])/.test(n)) return "jcb";
  if (/^(5[1-5]|2(2[2-9][1-9]|[3-6][0-9]{2}|7[01][0-9]|720))/.test(n)) {
    return "mastercard";
  }
  return "unknown";
}

// AMEX dan Diners memakai panjang berbeda dari kartu lain — memaksakan 16 digit
// untuk semua akan menolak kartu yang sebenarnya sah.
export function cardNumberLength(brand: CardBrand): number {
  if (brand === "amex") return 15;
  if (brand === "diners") return 14;
  return 16;
}

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

/** Kelompokkan digit sesuai penerbit: AMEX 4-6-5, sisanya per 4. */
export function formatCardNumber(value: string): string {
  const brand = detectCardBrand(value);
  const n = digitsOnly(value).slice(0, cardNumberLength(brand));

  const groups = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
  const out: string[] = [];
  let i = 0;
  for (const size of groups) {
    if (i >= n.length) break;
    out.push(n.slice(i, i + size));
    i += size;
  }
  return out.join(" ");
}

/** "1230" → "12/30". Bulan di atas 12 dianggap salah ketik dan dinolkan. */
export function formatExpiry(value: string): string {
  let n = digitsOnly(value).slice(0, 4);
  if (n.length >= 1) {
    // "5" hampir pasti berarti bulan Mei, bukan awal dari bulan ke-5x.
    if (parseInt(n[0], 10) > 1) n = `0${n}`.slice(0, 4);
  }
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}/${n.slice(2)}`;
}

/**
 * Algoritma Luhn — pemeriksaan checksum yang dipakai semua penerbit kartu.
 * Menangkap salah ketik satu digit dan sebagian besar digit tertukar, jadi
 * kesalahan ketik ketahuan sebelum formulir dikirim.
 */
export function luhnCheck(value: string): boolean {
  const n = digitsOnly(value);
  if (n.length < 12) return false;

  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(n[i], 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Kedaluwarsa dianggap sah sampai akhir bulan yang tertera. */
export function isExpiryValid(value: string, now = new Date()): boolean {
  const n = digitsOnly(value);
  if (n.length !== 4) return false;

  const month = parseInt(n.slice(0, 2), 10);
  const year = 2000 + parseInt(n.slice(2), 10);
  if (month < 1 || month > 12) return false;

  const endOfMonth = new Date(year, month, 1).getTime();
  return endOfMonth > now.getTime();
}

export type CardInput = {
  number: string;
  expiry: string;
  cvc: string;
  holder: string;
};

export type CardErrors = Partial<Record<keyof CardInput, string>>;

export function validateCard(input: CardInput, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  const brand = detectCardBrand(input.number);
  const digits = digitsOnly(input.number);

  if (digits.length !== cardNumberLength(brand)) {
    errors.number = "カード番号の桁数が正しくありません。";
  } else if (!luhnCheck(digits)) {
    errors.number = "カード番号をご確認ください。";
  }

  if (!isExpiryValid(input.expiry, now)) {
    errors.expiry = "有効期限をご確認ください。";
  }

  if (digitsOnly(input.cvc).length !== cvcLength(brand)) {
    errors.cvc = `セキュリティコードは${cvcLength(brand)}桁です。`;
  }

  if (input.holder.trim().length < 2) {
    errors.holder = "カード名義を入力してください。";
  }

  return errors;
}

/**
 * Label yang disimpan ke orders.paymentMethod.
 *
 * Hanya empat digit terakhir yang ikut — itu praktik standar dan cukup untuk
 * mengenali kartu di riwayat pesanan tanpa menyimpan nomor lengkapnya.
 */
export function paymentLabel(
  methodId: PaymentMethodId,
  cardNumber?: string,
): string {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  if (!method) return "不明";

  if (methodId === "card" && cardNumber) {
    const digits = digitsOnly(cardNumber);
    const last4 = digits.slice(-4);
    const brand = cardBrandLabel(detectCardBrand(digits));
    return last4
      ? `${method.label}（${brand} •••• ${last4}）`
      : method.label;
  }
  return method.label;
}

// Nomor uji yang dikenal luas dan TIDAK pernah bisa dipakai bertransaksi.
// Ditampilkan di UI supaya penguji tidak tergoda memasukkan kartu asli.
export const DEMO_CARDS = [
  { brand: "Visa", number: "4242 4242 4242 4242" },
  { brand: "Mastercard", number: "5555 5555 5555 4444" },
  { brand: "JCB", number: "3530 1113 3330 0000" },
  { brand: "AMEX", number: "3782 822463 10005" },
];

/** Nomor pembayaran コンビニ, dibangkitkan dari id pesanan agar tetap sama. */
export function konbiniNumber(orderId: number): string {
  const base = (orderId * 7919 + 100000) % 1000000;
  return `${String(base).padStart(6, "0")}-${String((orderId * 31) % 10000).padStart(4, "0")}`;
}
