import { db, categoriesTable, productsTable } from "@workspace/db";

const categories = [
  { name: "Dresses", slug: "dresses" },
  { name: "Outerwear", slug: "outerwear" },
  { name: "Tops", slug: "tops" },
  { name: "Bottoms", slug: "bottoms" },
];

// price dan originalPrice bertipe numeric di Postgres, jadi Drizzle
// mengharapkan string. Angka JavaScript akan ditolak.
const products = [
  {
    name: "Burgundy Silk Slip Dress",
    brand: "MAISON NOIR",
    price: "289.00",
    originalPrice: "410.00",
    description:
      "A bias-cut slip in heavyweight silk charmeuse. Falls close to the body without clinging, with a cowl neck that holds its shape.",
    imageUrl: "/assets/dress-burgundy-silk.jpg",
    category: "dresses",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Burgundy"],
    stock: 12,
    rating: "4.80",
    reviewCount: 64,
    isNew: false,
    isSale: true,
  },
  {
    name: "Emerald Satin Midi Dress",
    brand: "MAISON NOIR",
    price: "340.00",
    originalPrice: null,
    description:
      "Fluid satin cut to a calf-skimming midi length. Deep emerald with a subtle sheen that shifts under light.",
    imageUrl: "/assets/dress-emerald-satin.jpg",
    category: "dresses",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Green"],
    stock: 8,
    rating: "4.60",
    reviewCount: 41,
    isNew: true,
    isSale: false,
  },
  {
    name: "Camel Wool Overcoat",
    brand: "ATELIER SUD",
    price: "620.00",
    originalPrice: null,
    description:
      "Double-faced wool in a relaxed drop shoulder. Unlined so it drapes rather than structures, with deep patch pockets.",
    imageUrl: "/assets/coat-camel.jpg",
    category: "outerwear",
    sizes: ["S", "M", "L"],
    colors: ["Beige"],
    stock: 5,
    rating: "4.90",
    reviewCount: 87,
    isNew: true,
    isSale: false,
  },
  {
    name: "Black Leather Biker Jacket",
    brand: "ATELIER SUD",
    price: "780.00",
    originalPrice: "950.00",
    description:
      "Lamb leather with an asymmetric zip, softened at the seams so it moves from the first wear.",
    imageUrl: "/assets/jacket-black-leather.jpg",
    category: "outerwear",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Black"],
    stock: 6,
    rating: "4.70",
    reviewCount: 112,
    isNew: false,
    isSale: true,
  },
  {
    name: "White Linen Blazer",
    brand: "CORSO",
    price: "395.00",
    originalPrice: null,
    description:
      "Single-breasted linen blazer with a half lining. Creases readily, which is the point.",
    imageUrl: "/assets/blazer-white-linen.jpg",
    category: "outerwear",
    sizes: ["S", "M", "L"],
    colors: ["White"],
    stock: 10,
    rating: "4.50",
    reviewCount: 38,
    isNew: false,
    isSale: false,
  },
  {
    name: "White Poplin Shirt",
    brand: "CORSO",
    price: "165.00",
    originalPrice: null,
    description:
      "Crisp cotton poplin with a relaxed collar and a slightly dropped shoulder. Holds a press all day.",
    imageUrl: "/assets/shirt-white-poplin.jpg",
    category: "tops",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White"],
    stock: 24,
    rating: "4.40",
    reviewCount: 156,
    isNew: false,
    isSale: false,
  },
  {
    name: "Grey Wool Sweater",
    brand: "NORD",
    price: "245.00",
    originalPrice: null,
    description:
      "Merino knit in a heather grey, ribbed at the cuff and hem. Warm without bulk.",
    imageUrl: "/assets/sweater-grey-wool.jpg",
    category: "tops",
    sizes: ["S", "M", "L"],
    colors: ["Grey"],
    stock: 18,
    rating: "4.60",
    reviewCount: 73,
    isNew: false,
    isSale: false,
  },
  {
    name: "Black Turtleneck",
    brand: "NORD",
    price: "135.00",
    originalPrice: "180.00",
    description:
      "Fine-gauge stretch knit that layers flat under a jacket. High neck that stays put.",
    imageUrl: "/assets/top-black-turtleneck.jpg",
    category: "tops",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Black"],
    stock: 30,
    rating: "4.30",
    reviewCount: 201,
    isNew: false,
    isSale: true,
  },
  {
    name: "Navy Tailored Trousers",
    brand: "CORSO",
    price: "285.00",
    originalPrice: null,
    description:
      "Mid-rise wool trouser with a pressed crease and a straight leg that breaks at the shoe.",
    imageUrl: "/assets/trousers-navy.jpg",
    category: "bottoms",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Navy"],
    stock: 14,
    rating: "4.50",
    reviewCount: 59,
    isNew: false,
    isSale: false,
  },
  {
    name: "Cream Wide-Leg Trousers",
    brand: "MAISON NOIR",
    price: "310.00",
    originalPrice: null,
    description:
      "High-waisted with a generous wide leg in a heavy crepe. Sharp at the waist, fluid below.",
    imageUrl: "/assets/trousers-cream-wide.jpg",
    category: "bottoms",
    sizes: ["XS", "S", "M"],
    colors: ["Beige"],
    stock: 9,
    rating: "4.70",
    reviewCount: 44,
    isNew: true,
    isSale: false,
  },
  {
    name: "Distressed Straight Jeans",
    brand: "NORD",
    price: "195.00",
    originalPrice: null,
    description:
      "Rigid Japanese denim with hand-sanded wear at the knee and hem. Softens to the body over time.",
    imageUrl: "/assets/jeans-distressed.jpg",
    category: "bottoms",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blue"],
    stock: 22,
    rating: "4.20",
    reviewCount: 128,
    isNew: false,
    isSale: false,
  },
  {
    name: "Floral Wrap Skirt",
    brand: "ATELIER SUD",
    price: "220.00",
    originalPrice: "295.00",
    description:
      "True wrap skirt in printed viscose, tied at the waist. Falls to mid-calf with a soft front opening.",
    imageUrl: "/assets/skirt-floral-wrap.jpg",
    category: "bottoms",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Pink"],
    stock: 11,
    rating: "4.40",
    reviewCount: 52,
    isNew: false,
    isSale: true,
  },
];

async function seed() {
  console.log("Seeding categories...");
  await db.insert(categoriesTable).values(categories).onConflictDoNothing();

  console.log("Seeding products...");
  await db.insert(productsTable).values(products);

  console.log(
    `Done: ${categories.length} categories, ${products.length} products.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
