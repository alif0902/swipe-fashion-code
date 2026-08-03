// Katalog demo — DATA SAJA, tanpa efek samping.
//
// Berkas ini dipisahkan dari seed.ts karena seed.ts memanggil seed() di level
// teratas. Selama datanya masih tinggal di sana, sekadar meng-IMPORT-nya sudah
// menjalankan seeding: sync-products pernah menyisipkan 12 produk duplikat lalu
// mati oleh process.exit() milik seed sebelum sempat bekerja.
//
// Modul mana pun boleh mengimpor dari sini dengan aman.
//
// KONVENSI FOTO: images[0] SELALU foto model (orang yang memakai garmennya),
// foto produk (flat lay / ghost mannequin) ditaruh TERAKHIR. product-card.tsx
// menampilkan images[0] lebih dulu lalu membiarkan pengguna menggeser — jadi
// urutan ini yang membuat kartu feed membuka dengan sosok manusia, bukan
// dengan garmen yang menggantung.
//
// imageUrl sengaja dibuat sama dengan images[0]. Kolom itu dipakai sebagai
// thumbnail di riwayat pesanan, lookbook, 一目惚れ, match overlay, daftar
// admin, dan gambar OG — menyamakannya menjaga foto pertama yang dilihat
// pengguna tetap konsisten di seluruh aplikasi.
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
    name: "ワイドデニムパンツ",
    brand: "MAISON NOIR",
    price: "9900.00",
    originalPrice: null,
    description:
      "ややゆとりをもたせたワイドストレート。膝から裾までまっすぐ落ちます。",
    imageUrl: "/assets/jeans-wide-denim-model.webp",
    category: "bottoms",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Indigo"],
    images: [
      "/assets/jeans-wide-denim-model.webp",
      "/assets/jeans-wide-denim.webp",
    ],
    material: "コットン100%",
    feel: "歩くと裾がふわりと遅れてついてくる。",
    dimensions: {
      "ウエスト": "68cm",
      "股上": "30cm",
      "股下": "72cm",
      "わたり幅": "33cm",
      // Untuk celana yang namanya sendiri "ワイド", 裾幅 adalah angka yang
      // menentukan siluetnya. Tanpa ini pembeli tidak tahu seberapa lebar
      // kaki bawahnya, padahal itu justru yang dilihat orang.
      "裾幅": "28cm",
    },
    stock: 21,
    rating: "4.50",
    reviewCount: 88,
    isNew: false,
    isSale: false,
  },
  {
    name: "タックワイドチノ",
    brand: "CORSO",
    price: "10900.00",
    originalPrice: null,
    description:
      "深めのタックで腰まわりに余裕を。落ち感のあるコットンツイルです。",
    imageUrl: "/assets/trousers-tan-pleated-model.webp",
    category: "bottoms",
    gender: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Camel"],
    images: [
      "/assets/trousers-tan-pleated-model.webp",
      "/assets/trousers-tan-pleated.webp",
    ],
    material: "コットン100%",
    feel: "腰まわりが窮屈にならない、一日ぶんの余裕。",
    dimensions: {
      "ウエスト": "76cm",
      "股上": "32cm",
      // 70cm untuk celana pria memang pendek — dan itu disengaja: fotonya
      // memperlihatkan potongan ankle yang berhenti di atas sepatu.
      "股下": "70cm",
      "わたり幅": "35cm",
      "裾幅": "24cm",
    },
    stock: 16,
    rating: "4.40",
    reviewCount: 47,
    isNew: false,
    isSale: false,
  },
  {
    name: "ノースリーブミディワンピース",
    brand: "ATELIER SUD",
    price: "13900.00",
    originalPrice: null,
    description:
      "身体の線を拾わないAライン。一枚でも、ニットを重ねても着られます。",
    imageUrl: "/assets/dress-maroon-midi-model.webp",
    category: "dresses",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Burgundy"],
    images: [
      "/assets/dress-maroon-midi-model.webp",
      "/assets/dress-maroon-midi.webp",
    ],
    material: "ポリエステル65% / レーヨン30% / ポリウレタン5%",
    feel: "体の線を拾わないから、座っても気にならない。",
    dimensions: {
      "着丈": "118cm",
      "身幅": "46cm",
      "肩幅": "34cm",
    },
    stock: 12,
    rating: "4.60",
    reviewCount: 61,
    isNew: false,
    isSale: false,
  },
  {
    name: "フラワープリントワンピース",
    brand: "ATELIER SUD",
    price: "12900.00",
    originalPrice: "18900.00",
    description:
      "透ける総柄を、無地のインナードレスに重ねた二枚仕立て。歩くたびに柄が静かに動きます。",
    imageUrl: "/assets/dress-red-floral-model.webp",
    category: "dresses",
    gender: "women",
    sizes: ["XS", "S", "M"],
    colors: ["Red"],
    images: [
      "/assets/dress-red-floral-model.webp",
      "/assets/dress-red-floral.webp",
    ],
    material: "ポリエステル100%",
    feel: "風が通るたび、柄がゆっくり動く。",
    // Kamisol bertali tipis: tidak ada bahu untuk diukur, jadi 肩幅 dilepas.
    // Diganti 裾回り, yang justru jadi daya tarik potongan tiered ini.
    dimensions: {
      "着丈": "124cm",
      "身幅": "48cm",
      "裾回り": "210cm",
    },
    stock: 8,
    rating: "4.70",
    reviewCount: 54,
    isNew: false,
    isSale: true,
  },
  {
    name: "コーラルブルゾン",
    brand: "NORD",
    price: "15900.00",
    originalPrice: null,
    description:
      "起毛感のある厚手のスウェット地。袖と裾のリブで裾がもたつきません。",
    imageUrl: "/assets/jacket-coral-bomber-model.webp",
    category: "outerwear",
    gender: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Coral"],
    images: [
      "/assets/jacket-coral-bomber-model.webp",
      "/assets/jacket-coral-bomber.webp",
    ],
    material: "コットン65% / ポリエステル35%",
    feel: "羽織った瞬間、肩の力が抜ける厚み。",
    dimensions: {
      "着丈": "66cm",
      "身幅": "56cm",
      "肩幅": "46cm",
      "袖丈": "60cm",
    },
    stock: 10,
    rating: "4.50",
    reviewCount: 35,
    isNew: true,
    isSale: false,
  },
  {
    name: "ヘビーウェイトパーカ",
    brand: "NORD",
    price: "8900.00",
    originalPrice: null,
    description:
      "肉厚な裏起毛。洗ってもへたらない密度で編んでいます。",
    imageUrl: "/assets/hoodie-black-model.webp",
    category: "outerwear",
    gender: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black"],
    images: ["/assets/hoodie-black-model.webp", "/assets/hoodie-black.webp"],
    material: "コットン100%",
    feel: "洗うほど身体になじんで、へたらない。",
    dimensions: {
      "着丈": "70cm",
      "身幅": "58cm",
      "肩幅": "50cm",
      "袖丈": "60cm",
    },
    stock: 27,
    rating: "4.60",
    reviewCount: 142,
    isNew: false,
    isSale: false,
  },
  {
    // Dulu bernama "ネイビーテーラードスーツ", tapi yang dijual — dan yang
    // diukur di dimensions — hanya jaketnya. Foto model memakai celana serasi
    // sebagai penataan gaya, bukan sebagai bagian dari produk.
    name: "ネイビーテーラードジャケット",
    brand: "CORSO",
    price: "19900.00",
    originalPrice: null,
    description:
      "きちんと見えるのに肩は柔らかく。ウールのしなやかさを生かした一着。単品でも、同系色のボトムスと合わせても。",
    imageUrl: "/assets/suit-navy-tailored-model.webp",
    category: "outerwear",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Navy"],
    images: [
      "/assets/suit-navy-tailored-model.webp",
      "/assets/suit-navy-tailored.webp",
    ],
    material: "ウール95% / ポリウレタン5%",
    feel: "肩に置くだけで、背筋が伸びる。",
    dimensions: {
      "着丈": "70cm",
      "身幅": "50cm",
      "肩幅": "40cm",
      "袖丈": "58cm",
    },
    stock: 6,
    rating: "4.80",
    reviewCount: 29,
    isNew: true,
    isSale: false,
  },
  {
    name: "コットンポロシャツ",
    brand: "CORSO",
    price: "5900.00",
    originalPrice: null,
    description:
      "目の詰まった鹿の子編み。襟が最後までへたりません。3色展開。",
    imageUrl: "/assets/polo-cotton-model-pink.webp",
    category: "tops",
    gender: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Pink", "Grey", "Blue"],
    // Tiga foto model lebih dulu, urutannya sama dengan colors di atas, lalu
    // flat lay tiga warna sebagai penutup.
    images: [
      "/assets/polo-cotton-model-pink.webp",
      "/assets/polo-cotton-model-grey.webp",
      "/assets/polo-cotton-model-blue.webp",
      "/assets/polo-cotton.webp",
    ],
    material: "コットン100%",
    feel: "一日着ても、襟が最後まで立っている。",
    dimensions: {
      "着丈": "62cm",
      "身幅": "48cm",
      "肩幅": "38cm",
      "袖丈": "20cm",
    },
    stock: 34,
    rating: "4.40",
    reviewCount: 203,
    isNew: false,
    isSale: false,
  },
  {
    name: "ラグランプリントT",
    brand: "MAISON NOIR",
    price: "3900.00",
    originalPrice: null,
    description:
      "杢地に赤のラグラン袖。プリントはひび割れにくい厚盛りです。",
    imageUrl: "/assets/tee-raglan-red-model.webp",
    category: "tops",
    gender: "women",
    sizes: ["S", "M", "L"],
    colors: ["Red"],
    images: ["/assets/tee-raglan-red-model.webp", "/assets/tee-raglan-red.webp"],
    material: "コットン90% / ポリエステル10%",
    feel: "腕を上げても、肩が突っぱらない。",
    // Raglan tidak punya jahitan bahu, jadi 肩幅 tidak bisa diukur — patokan
    // yang dipakai toko Jepang untuk potongan ini adalah 裄丈, diukur dari
    // tengah belakang leher sampai ujung manset. Ia menggantikan 肩幅 DAN
    // 袖丈 sekaligus; mencantumkan ketiganya berarti menghitung ganda.
    dimensions: {
      "着丈": "60cm",
      "身幅": "46cm",
      "裄丈": "62cm",
    },
    stock: 19,
    rating: "4.30",
    reviewCount: 76,
    isNew: false,
    isSale: false,
  },
];
