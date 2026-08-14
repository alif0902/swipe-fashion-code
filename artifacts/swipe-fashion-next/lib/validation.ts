import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.number().int().positive(),
  selectedSize: z.string().min(1),
  selectedColor: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const reviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  authorName: z
    .string()
    .trim()
    .min(1, "お名前を入力してください")
    .max(20, "お名前は20文字までです"),
  body: z
    .string()
    .trim()
    .min(10, "10文字以上でご記入ください")
    .max(500, "500文字までです"),
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

export const MIN_PASSWORD_LENGTH = 8;

export const emailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("メールアドレスの形式が正しくありません");

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

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
});

export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length < MIN_PASSWORD_LENGTH) return 0;

  let score = 1;
  if (password.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

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

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const profileSchema = z
  .object({
    name: z
      .string()
      .min(1, "お名前を入力してください")
      .max(50, "お名前が長すぎます"),
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
    images: z.array(z.string().url()).min(1, "写真を1枚以上追加してください").max(6),
    category: z.string().min(1, "カテゴリーを選んでください"),
    gender: z.enum(["women", "men"]),
    sizes: z.array(z.string()).max(12),
    colors: z.array(z.string()).max(12),
    material: z.string().max(120).nullable(),
    feel: z.string().max(60).nullable(),
    dimensions: z.record(z.string(), z.string()),
    stock: z.number().int().min(0, "在庫は0以上で入力してください").max(9999),
    isNew: z.boolean(),
    isSale: z.boolean(),
  })
  .refine(
    (v) => v.originalPrice === null || v.originalPrice > v.price,
    { message: "参考価格は販売価格より高くしてください", path: ["originalPrice"] },
  );

export type ProductInput = z.infer<typeof productSchema>;

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type SuperLikeInput = z.infer<typeof superLikeSchema>;
export type RecordSwipeInput = z.infer<typeof recordSwipeSchema>;
