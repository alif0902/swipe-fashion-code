import { z } from "zod";

// sessionId sengaja tidak ada di sini. Server membacanya dari cookie httpOnly,
// supaya klien tidak bisa membuat order atas nama sesi orang lain.
export const createOrderSchema = z.object({
  productId: z.number().int().positive(),
  selectedSize: z.string().min(1),
  selectedColor: z.string().min(1),
  // Batas atas bukan sekadar kerapian: tanpa ini satu-satunya penahan adalah
  // pemeriksaan stok, jadi kalau pemeriksaan itu berubah suatu saat, tidak ada
  // lapis kedua yang menahan angka yang tidak masuk akal.
  quantity: z.number().int().min(1).max(99),
});

export const confirmOrderSchema = z.object({
  paymentMethod: z.string().min(1),
  shippingAddress: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
});

export const superLikeSchema = z.object({
  productId: z.number().int().positive(),
});

export const recordSwipeSchema = z.object({
  productId: z.number().int().positive(),
  direction: z.enum(["pass", "like", "super"]),
});

// ---------------------------------------------------------------------------
// Akun
//
// Pesan kesalahan ditulis dalam bahasa Jepang karena akan tampil apa adanya di
// formulir. Aturannya sengaja dipisah dari komponen supaya bisa diuji sebagai
// fungsi murni, mengikuti pola lib/taste.ts dan lib/payment.ts.
// ---------------------------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 8;

export const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("メールアドレスの形式が正しくありません");

// Panjang minimum 8, dan wajib memuat huruf sekaligus angka. Batas atas 128
// dipasang bukan demi keamanan melainkan agar hashing Argon2id tidak dipakai
// menghabiskan CPU server lewat kiriman yang sangat panjang.
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`)
  .max(128, "パスワードが長すぎます")
  .regex(/[a-zA-Z]/, "パスワードに英字を含めてください")
  .regex(/[0-9]/, "パスワードに数字を含めてください");

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "お名前を入力してください")
    .max(50, "お名前が長すぎます"),
  email: emailSchema,
  password: passwordSchema,
});

// Sengaja TIDAK memakai passwordSchema. Kalau aturan kekuatan password
// diperketat nanti, pemilik akun lama harus tetap bisa masuk dengan password
// lamanya — validasi ketat di sini akan mengunci mereka di luar.
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
});

/**
 * Kekuatan password untuk indikator di formulir, 0–3.
 *
 * Murni kosmetik: yang menentukan boleh-tidaknya mendaftar tetap
 * `passwordSchema`. Dipisah agar tampilan indikator tidak diam-diam menjadi
 * aturan kedua yang berbeda dari validasi sebenarnya.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length < MIN_PASSWORD_LENGTH) return 0;

  let score = 1;
  if (password.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

/**
 * 47 prefektur, urutan resmi dari utara ke selatan (kode JIS).
 *
 * Dipakai sebagai daftar pilihan, bukan kolom ketik bebas. Prefektur adalah
 * himpunan tertutup, dan salah ketik satu huruf membuat alamat gagal dipilah
 * kurir — persis alasan setiap toko Jepang memakai dropdown di sini.
 */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県",
  "沖縄県",
] as const;

// Alamat opsional — orang boleh punya akun tanpa pernah berbelanja. Yang
// memaksanya terisi adalah checkout, bukan formulir profil.
//
// Tapi kalau salah satu bagian alamat diisi, tiga bagian wajibnya harus ikut
// terisi. Alamat setengah jadi lebih berbahaya daripada alamat kosong: yang
// kosong meminta diisi saat checkout, yang setengah jadi lolos begitu saja.
const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const profileSchema = z
  .object({
    name: z
      .string()
      .min(1, "お名前を入力してください")
      .max(50, "お名前が長すぎます"),
    // 7 digit, tanda hubung boleh ada boleh tidak — keduanya lazim ditulis.
    postalCode: z
      .string()
      .regex(/^\d{3}-?\d{4}$/, "郵便番号は7桁で入力してください")
      .optional()
      .or(z.literal("")),
    prefecture: z
      .union([z.enum(PREFECTURES), z.literal("")])
      .optional(),
    city: optionalText(60, "市区町村が長すぎます"),
    address: optionalText(100, "番地が長すぎます"),
    building: optionalText(100, "建物名が長すぎます"),
  })
  .refine(
    (v) => {
      const filled = [v.postalCode, v.prefecture, v.city, v.address, v.building]
        .some((part) => (part ?? "").trim() !== "");
      if (!filled) return true;
      return Boolean(v.prefecture && v.city?.trim() && v.address?.trim());
    },
    {
      message: "都道府県・市区町村・番地をすべて入力してください",
      path: ["address"],
    },
  );

// ---------------------------------------------------------------------------
// Produk (admin)
// ---------------------------------------------------------------------------

/**
 * Kunci ukuran yang diusulkan per kategori.
 *
 * Kolom `dimensions` bertipe jsonb dengan kunci bebas, dan itu disengaja —
 * atasan diukur 着丈/身幅/肩幅, bawahan diukur ウエスト/股上/股下. Tapi kunci
 * bebas berarti admin harus mengarang nama kolomnya sendiri setiap kali, dan
 * satu salah ketik membuat tabel 基本情報 di kartu feed tampil tidak konsisten.
 *
 * Daftar ini yang mengisinya otomatis begitu kategori dipilih. Admin tinggal
 * mengisi angkanya, dan tetap boleh menambah kunci sendiri kalau perlu.
 */
export const DIMENSION_PRESETS: Record<string, string[]> = {
  tops: ["着丈", "身幅", "肩幅", "袖丈"],
  outerwear: ["着丈", "身幅", "肩幅", "袖丈"],
  dresses: ["着丈", "身幅", "肩幅", "袖丈"],
  bottoms: ["ウエスト", "股上", "股下", "わたり幅"],
};

export const SIZE_PRESETS: Record<string, string[]> = {
  tops: ["S", "M", "L"],
  outerwear: ["S", "M", "L"],
  dresses: ["S", "M", "L"],
  bottoms: ["S", "M", "L", "XL"],
};

export const productSchema = z
  .object({
    name: z.string().min(1, "商品名を入力してください").max(120, "商品名が長すぎます"),
    brand: z.string().min(1, "ブランド名を入力してください").max(60, "ブランド名が長すぎます"),
    price: z.number().positive("価格を入力してください").max(99_999_999),
    originalPrice: z.number().positive().max(99_999_999).nullable(),
    description: z.string().min(1, "商品説明を入力してください").max(2000),
    // Minimal satu foto: kartu feed tidak punya keadaan "tanpa gambar", dan
    // membuatnya hanya untuk kasus yang seharusnya tidak ada itu sia-sia.
    images: z.array(z.string().url()).min(1, "写真を1枚以上追加してください").max(6),
    category: z.string().min(1, "カテゴリーを選んでください"),
    gender: z.enum(["women", "men"]),
    sizes: z.array(z.string()).max(12),
    colors: z.array(z.string()).max(12),
    material: z.string().max(120).nullable(),
    // Dibatasi 60 karakter: gelembung caption di kartu feed hanya muat sekitar
    // dua baris pendek. Lebih dari itu akan terpotong atau mendorong tata
    // letak kartu.
    feel: z.string().max(60).nullable(),
    dimensions: z.record(z.string(), z.string()),
    stock: z.number().int().min(0, "在庫は0以上で入力してください").max(9999),
    isNew: z.boolean(),
    isSale: z.boolean(),
  })
  // Harga coret yang lebih murah dari harga jual adalah kesalahan ketik yang
  // tampil sebagai diskon negatif di kartu feed. Ditangkap di sini, bukan
  // dibiarkan sampai ada yang melihatnya.
  .refine(
    (v) => v.originalPrice === null || v.originalPrice > v.price,
    { message: "参考価格は販売価格より高くしてください", path: ["originalPrice"] },
  );

export type ProductInput = z.infer<typeof productSchema>;

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type SuperLikeInput = z.infer<typeof superLikeSchema>;
export type RecordSwipeInput = z.infer<typeof recordSwipeSchema>;
