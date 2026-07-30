import { z } from "zod";

// sessionId sengaja tidak ada di sini. Server membacanya dari cookie httpOnly,
// supaya klien tidak bisa membuat order atas nama sesi orang lain.
export const createOrderSchema = z.object({
  productId: z.number().int().positive(),
  selectedSize: z.string().min(1),
  selectedColor: z.string().min(1),
  quantity: z.number().int().min(1),
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

// Alamat opsional — orang boleh punya akun tanpa pernah berbelanja. Yang
// memaksanya terisi adalah checkout, bukan formulir profil.
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "お名前を入力してください")
    .max(50, "お名前が長すぎます"),
  // Format Jepang: 7 digit, tanda hubung boleh ada boleh tidak.
  postalCode: z
    .string()
    .regex(/^\d{3}-?\d{4}$/, "郵便番号は7桁で入力してください")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, "住所が長すぎます")
    .optional()
    .or(z.literal("")),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type SuperLikeInput = z.infer<typeof superLikeSchema>;
export type RecordSwipeInput = z.infer<typeof recordSwipeSchema>;
