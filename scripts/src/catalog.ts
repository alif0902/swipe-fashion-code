// Katalog demo — DATA SAJA, tanpa efek samping.
//
// Berkas ini dipisahkan dari seed.ts karena seed.ts memanggil seed() di level
// teratas. Selama datanya masih tinggal di sana, sekadar meng-IMPORT-nya sudah
// menjalankan seeding: sync-products pernah menyisipkan 12 produk duplikat lalu
// mati oleh process.exit() milik seed sebelum sempat bekerja.
//
// Modul mana pun boleh mengimpor dari sini dengan aman.
import { productsTable } from "@workspace/db";

export const categories = [
  { name: "Dresses", slug: "dresses" },
  { name: "Outerwear", slug: "outerwear" },
  { name: "Tops", slug: "tops" },
  { name: "Bottoms", slug: "bottoms" },
];

// price dan originalPrice bertipe numeric di Postgres, jadi Drizzle
// mengharapkan string. Angka JavaScript akan ditolak.
// Tipe dipatok eksplisit ke bentuk insert Drizzle. Tanpa ini TypeScript
// menyimpulkan array sebagai union tipe literal — tiap produk punya kunci
// dimensions yang berbeda — dan db.insert menolaknya.
export const products: (typeof productsTable.$inferInsert)[] = [
  {
    name: "Burgundy Silk Slip Dress",
    brand: "MAISON NOIR",
    price: "43400.00",
    originalPrice: "61500.00",
    description:
      "厚みのあるシルクシャルムーズをバイアス裁ちで。体に沿いながら張りつかず、ドレープの落ち方がきれいに出ます。",
    imageUrl: "/assets/dress-burgundy-silk.jpg",
    category: "dresses",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Burgundy"],
    images: [
      "/assets/dress-burgundy-silk.jpg",
      "/assets/details/dress-burgundy-silk-detail.jpg",
    ],
    material: "シルク100%",
    dimensions: {
      "着丈": "120cm",
      "身幅": "44cm",
      "裄丈": "32cm",
    },
    stock: 12,
    rating: "4.80",
    reviewCount: 64,
    isNew: false,
    isSale: true,
  },
  {
    name: "Camel Wool Overcoat",
    brand: "ATELIER SUD",
    price: "93000.00",
    originalPrice: null,
    description:
      "ダブルフェイスのウールを一枚仕立てで。裏地がないぶん軽く、肩からまっすぐ落ちるシルエットです。",
    imageUrl: "/assets/coat-camel.jpg",
    category: "outerwear",
    gender: "women",
    sizes: ["S", "M", "L"],
    colors: ["Beige"],
    images: [
      "/assets/coat-camel.jpg",
      "/assets/details/coat-camel-detail.jpg",
    ],
    material: "ウール80% / カシミヤ20%",
    dimensions: {
      "着丈": "110cm",
      "身幅": "58cm",
      "肩幅": "46cm",
      "袖丈": "62cm",
    },
    stock: 5,
    rating: "4.90",
    reviewCount: 87,
    isNew: true,
    isSale: false,
  },
  {
    name: "White Linen Blazer",
    brand: "CORSO",
    price: "59200.00",
    originalPrice: null,
    description:
      "リネン100%のアンコンジャケット。肩パッドを入れず、シャツのように羽織れます。",
    imageUrl: "/assets/blazer-white-linen.jpg",
    category: "outerwear",
    gender: "women",
    sizes: ["S", "M", "L"],
    colors: ["White"],
    images: [
      "/assets/blazer-white-linen.jpg",
      "/assets/details/blazer-white-linen-detail.jpg",
    ],
    material: "リネン100%",
    dimensions: {
      "着丈": "68cm",
      "身幅": "52cm",
      "肩幅": "42cm",
      "袖丈": "59cm",
    },
    stock: 10,
    rating: "4.50",
    reviewCount: 38,
    isNew: false,
    isSale: false,
  },
  {
    name: "White Poplin Shirt",
    brand: "CORSO",
    price: "24800.00",
    originalPrice: null,
    description:
      "しっかり打ち込んだコットンポプリン。洗うほどに肌なじみがよくなります。",
    imageUrl: "/assets/shirt-white-poplin.jpg",
    category: "tops",
    gender: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White"],
    images: [
      "/assets/shirt-white-poplin.jpg",
      "/assets/details/shirt-white-poplin-detail.jpg",
    ],
    material: "コットン100%",
    dimensions: {
      "着丈": "68cm",
      "身幅": "54cm",
      "肩幅": "44cm",
      "袖丈": "60cm",
    },
    stock: 24,
    rating: "4.40",
    reviewCount: 156,
    isNew: false,
    isSale: false,
  },
  {
    name: "Grey Wool Sweater",
    brand: "NORD",
    price: "36800.00",
    originalPrice: null,
    description:
      "空気を含ませて編んだウール。一枚でも、シャツの上からでも。",
    imageUrl: "/assets/sweater-grey-wool.jpg",
    category: "tops",
    gender: "women",
    sizes: ["S", "M", "L"],
    colors: ["Grey"],
    images: [
      "/assets/sweater-grey-wool.jpg",
      "/assets/details/sweater-grey-wool-detail.jpg",
    ],
    material: "ウール100%",
    dimensions: {
      "着丈": "62cm",
      "身幅": "52cm",
      "肩幅": "42cm",
      "袖丈": "58cm",
    },
    stock: 18,
    rating: "4.60",
    reviewCount: 73,
    isNew: false,
    isSale: false,
  },
  {
    name: "Navy Tailored Trousers",
    brand: "CORSO",
    price: "42800.00",
    originalPrice: null,
    description:
      "ウールにわずかなストレッチを効かせて。センタープレスが脚をまっすぐ見せます。",
    imageUrl: "/assets/trousers-navy.jpg",
    category: "bottoms",
    gender: "men",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Navy"],
    images: [
      "/assets/trousers-navy.jpg",
      "/assets/details/trousers-navy-detail.jpg",
    ],
    material: "ウール95% / ポリウレタン5%",
    dimensions: {
      "ウエスト": "70cm",
      "股上": "28cm",
      "股下": "76cm",
      "わたり幅": "30cm",
    },
    stock: 14,
    rating: "4.50",
    reviewCount: 59,
    isNew: false,
    isSale: false,
  },
  {
    name: "Cream Wide-Leg Trousers",
    brand: "MAISON NOIR",
    price: "46500.00",
    originalPrice: null,
    description:
      "コットンリネンのワイドシルエット。腰まわりはすっきり、裾に向かって広がります。",
    imageUrl: "/assets/trousers-cream-wide.jpg",
    category: "bottoms",
    gender: "women",
    sizes: ["XS", "S", "M"],
    colors: ["Beige"],
    images: [
      "/assets/trousers-cream-wide.jpg",
      "/assets/details/trousers-cream-wide-detail.jpg",
    ],
    material: "コットン60% / リネン40%",
    dimensions: {
      "ウエスト": "68cm",
      "股上": "30cm",
      "股下": "74cm",
      "わたり幅": "34cm",
    },
    stock: 9,
    rating: "4.70",
    reviewCount: 44,
    isNew: true,
    isSale: false,
  },
  {
    name: "Floral Wrap Skirt",
    brand: "ATELIER SUD",
    price: "33000.00",
    originalPrice: "44200.00",
    description:
      "レーヨンの落ち感を生かした巻きスカート。歩くたびに柄が静かに動きます。",
    imageUrl: "/assets/skirt-floral-wrap.jpg",
    category: "bottoms",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Pink"],
    images: [
      "/assets/skirt-floral-wrap.jpg",
      "/assets/details/skirt-floral-wrap-detail.jpg",
    ],
    material: "レーヨン100%",
    dimensions: {
      "ウエスト": "66cm",
      "着丈": "78cm",
    },
    stock: 11,
    rating: "4.40",
    reviewCount: 52,
    isNew: false,
    isSale: true,
  },
];
