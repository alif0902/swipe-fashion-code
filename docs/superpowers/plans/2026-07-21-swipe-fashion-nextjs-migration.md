# Migrasi SwipeFash ke Next.js — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun `artifacts/swipe-fashion-next` — satu aplikasi Next.js App Router yang menggantikan Vite SPA plus Express API, dengan tampilan yang tidak berubah, di-deploy ke Vercel dengan database Supabase.

**Architecture:** Aplikasi baru dibuat berdampingan; aplikasi lama tetap utuh sampai yang baru terbukti setara. Server Components meng-query Drizzle langsung tanpa perantara HTTP. Mutasi lewat Server Actions. Sesi pindah dari localStorage ke cookie httpOnly agar server bisa membacanya.

**Tech Stack:** Next.js 16.2.10, React 19.1.0, Tailwind CSS 4, Drizzle ORM, Supabase Postgres, framer-motion, shadcn/ui, zod.

**Spec:** `docs/superpowers/specs/2026-07-21-swipe-fashion-nextjs-migration-design.md`

## Global Constraints

- Package manager **wajib pnpm**. `npm install` diblokir oleh guard di `package.json` root.
- Versi React dipatok **tepat 19.1.0** di `pnpm-workspace.yaml` catalog karena expo. Jangan diubah.
- `pnpm-workspace.yaml` punya `minimumReleaseAge: 1440`. Paket yang rilis kurang dari 1 hari akan ditolak. Jangan menonaktifkan setelan ini.
- Dependency baru pakai `catalog:` bila namanya sudah ada di catalog root.
- Nama package: `@workspace/swipe-fashion-next`.
- Semua pekerjaan di branch `migrate-to-nextjs`. Baseline sebelum migrasi ada di commit `9b3b831` pada `main`.
- **Jangan menghapus atau mengubah** `artifacts/swipe-fashion` dan `artifacts/api-server` sampai Task 15.
- Nama variabel CSS `--app-font-sans`, `--app-font-serif`, `--app-font-mono` **tidak boleh berubah**. Seluruh JSX bergantung pada `font-serif` / `font-sans` yang di-map ke sana.
- Design token di `globals.css` disalin verbatim. Jangan menyetel ulang nilai HSL, `--radius`, atau isi `@layer base`.

## Catatan soal pengujian

Repo ini tidak punya test framework sama sekali. Plan ini **tidak** membangun harness test DB — itu di luar lingkup yang diminta. Yang dilakukan:

- **Vitest hanya untuk modul murni**: `lib/format.ts` dan `lib/validation.ts`. Keduanya tidak menyentuh DB, jadi murah untuk diuji dan justru bagian yang paling mudah salah diam-diam (konversi `numeric` Postgres dari string ke number).
- **Halaman dan Server Actions** diverifikasi lewat `next build`, `tsc --noEmit`, `curl` pada HTML hasil render server, dan perbandingan visual berdampingan dengan aplikasi lama.

Setiap task menyebutkan verifikasinya sendiri.

## Struktur file yang dibangun

| File | Tanggung jawab |
|---|---|
| `lib/db/src/index.ts` (modify) | Koneksi Postgres, diarahkan ke pooler Supabase |
| `scripts/src/seed.ts` (create) | Isi tabel categories dan products |
| `artifacts/swipe-fashion-next/lib/format.ts` | Ubah row DB jadi tipe aplikasi. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/validation.ts` | Skema zod input Server Action. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/data.ts` | Query baca untuk Server Component |
| `artifacts/swipe-fashion-next/lib/session.ts` | Baca cookie sesi |
| `artifacts/swipe-fashion-next/lib/utils.ts` | `cn()`, disalin dari app lama |
| `artifacts/swipe-fashion-next/middleware.ts` | Set cookie sesi bila belum ada |
| `artifacts/swipe-fashion-next/app/actions.ts` | createOrder, confirmOrder, cancelOrder |
| `artifacts/swipe-fashion-next/app/layout.tsx` | Font, globals.css, provider |
| `artifacts/swipe-fashion-next/app/*/page.tsx` | Satu file per rute |
| `artifacts/swipe-fashion-next/components/*` | layout, product-card, order-sheet |
| `artifacts/swipe-fashion-next/components/ui/*` | 10 file shadcn |

---

### Task 1: Arahkan lib/db ke Supabase

**Files:**
- Modify: `lib/db/src/index.ts:1-16`
- Create: `artifacts/swipe-fashion-next/.env.local.example`

**Interfaces:**
- Produces: `db` (instance Drizzle) dan `pool`, diekspor dari `@workspace/db`. Signature tidak berubah — hanya konfigurasi koneksinya.

**Konteks:** Supabase memberi dua connection string. Yang **direct** (port 5432) untuk migrasi schema. Yang **pooler / transaction mode** (port 6543) untuk runtime serverless. Vercel menjalankan tiap request di lingkungan yang bisa mati kapan saja, jadi pool besar akan menghabiskan slot koneksi Postgres. `max: 1` membuat tiap instance memegang paling banyak satu koneksi.

- [ ] **Step 1: Minta user menyiapkan Supabase**

Ini butuh tindakan manual user, tidak bisa diotomasi. Minta user:
1. Buat project baru di https://supabase.com
2. Buka Project Settings → Database → Connection string
3. Salin dua string: **Transaction pooler** (port 6543) dan **Direct connection** (port 5432)

- [ ] **Step 2: Tulis file contoh env**

Buat `artifacts/swipe-fashion-next/.env.local.example`:

```bash
# Transaction pooler (port 6543) — dipakai aplikasi saat runtime.
# Wajib pooler, bukan direct, karena Vercel berjalan serverless.
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres"

# Direct connection (port 5432) — hanya dipakai drizzle-kit push dan seed.
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
```

- [ ] **Step 3: Ubah koneksi database**

Ganti seluruh isi `lib/db/src/index.ts`:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase transaction pooler membatasi koneksi per klien. Di Vercel setiap
// instance serverless punya pool sendiri, jadi pool besar akan menghabiskan
// slot koneksi Postgres. Satu koneksi per instance sudah cukup.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
```

- [ ] **Step 4: Push schema ke Supabase**

`drizzle.config.ts` membaca `DATABASE_URL`. Untuk push pakai koneksi direct:

Run: `DATABASE_URL="$DIRECT_URL" pnpm --filter @workspace/db run push`

Expected: drizzle-kit melaporkan pembuatan tabel `categories`, `products`, `orders` dan enum `order_status`, `payment_status`. Selesai tanpa error.

- [ ] **Step 5: Verifikasi tabel benar-benar ada**

Run: `psql "$DIRECT_URL" -c "\dt"`

Expected: tiga tabel terdaftar. Jika `psql` tidak terpasang, cek lewat Table Editor di dashboard Supabase.

- [ ] **Step 6: Commit**

```bash
git add lib/db/src/index.ts artifacts/swipe-fashion-next/.env.local.example
git commit -m "feat(db): point Drizzle at Supabase transaction pooler"
```

---

### Task 2: Script seed

**Files:**
- Create: `scripts/src/seed.ts`
- Modify: `scripts/package.json`

**Interfaces:**
- Consumes: `db`, `categoriesTable`, `productsTable` dari `@workspace/db` (Task 1)
- Produces: 4 baris di `categories`, 12 baris di `products`. Kolom `imageUrl` selalu berawalan `/assets/`.

**Konteks:** `attached_assets/` berisi 16 file. Hanya 12 yang foto pakaian. Tiga di `generated_images/` dipakai halaman landing, dan `with-is-reference.png` tidak dirujuk kode mana pun.

- [ ] **Step 1: Periksa script package sudah ada**

Run: `cat scripts/package.json`

Catat nama package dan script yang sudah ada supaya entri baru mengikuti pola yang sama.

- [ ] **Step 2: Tulis script seed**

Buat `scripts/src/seed.ts`:

```ts
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
```

- [ ] **Step 3: Tambah script runner**

Tambahkan ke bagian `"scripts"` di `scripts/package.json`:

```json
"seed": "tsx src/seed.ts"
```

- [ ] **Step 4: Jalankan seed**

Run: `DATABASE_URL="$DIRECT_URL" pnpm --filter @workspace/scripts run seed`

Expected:
```
Seeding categories...
Seeding products...
Done: 4 categories, 12 products.
```

Bila nama package di `scripts/package.json` bukan `@workspace/scripts`, pakai nama yang sebenarnya.

- [ ] **Step 5: Verifikasi isi tabel**

Run: `psql "$DIRECT_URL" -c "SELECT category, count(*) FROM products GROUP BY category ORDER BY category;"`

Expected:
```
 category  | count
-----------+-------
 bottoms   |     4
 dresses   |     2
 outerwear |     3
 tops      |     3
```

- [ ] **Step 6: Commit**

```bash
git add scripts/src/seed.ts scripts/package.json
git commit -m "feat(scripts): add seed for categories and products"
```

---

### Task 3: Scaffold aplikasi Next.js

**Files:**
- Create: `artifacts/swipe-fashion-next/package.json`
- Create: `artifacts/swipe-fashion-next/next.config.ts`
- Create: `artifacts/swipe-fashion-next/tsconfig.json`
- Create: `artifacts/swipe-fashion-next/postcss.config.mjs`
- Create: `artifacts/swipe-fashion-next/app/globals.css`
- Create: `artifacts/swipe-fashion-next/app/layout.tsx`
- Create: `artifacts/swipe-fashion-next/app/page.tsx` (sementara)
- Create: `artifacts/swipe-fashion-next/lib/utils.ts`

**Interfaces:**
- Produces: aplikasi Next yang bisa `dev` dan `build`, dengan seluruh design token dan font sudah aktif. Task berikutnya menumpang di atas ini.

**Konteks:** Aplikasi lama memuat font lewat `@import` Google Fonts di baris pertama `index.css`. Next punya `next/font/google` yang mengunduh font saat build dan menyajikannya dari domain sendiri — tidak ada permintaan ke pihak ketiga saat runtime dan tidak ada layout shift. Nama variabel CSS sengaja dipertahankan supaya tidak ada JSX yang perlu diubah.

- [ ] **Step 1: Buat package.json**

Buat `artifacts/swipe-fashion-next/package.json`:

```json
{
  "name": "@workspace/swipe-fashion-next",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port ${PORT:-20100}",
    "build": "next build",
    "start": "next start --port ${PORT:-20100}",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@workspace/db": "workspace:*",
    "class-variance-authority": "catalog:",
    "clsx": "catalog:",
    "framer-motion": "catalog:",
    "lucide-react": "catalog:",
    "next": "16.2.10",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tailwind-merge": "catalog:",
    "vaul": "^1.1.2",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "tailwindcss": "catalog:",
    "tw-animate-css": "^1.4.0",
    "typescript": "~5.9.3",
    "vitest": "^3.2.4"
  }
}
```

Radix yang didaftarkan hanya lima — sesuai 10 file shadcn yang dibawa. `drawer` memakai `vaul`, `toaster` memakai `@radix-ui/react-toast`.

Aplikasi lama menaruh seluruh paket di `devDependencies` karena Vite mem-bundle semuanya saat build, jadi tidak ada bedanya. Next berbeda: sebagian dependency ikut sampai runtime, dan install produksi bisa melewatkan `devDependencies`. Paket yang ada di dalam bundel harus berada di `dependencies`.

- [ ] **Step 2: Tambah @tailwindcss/postcss ke catalog**

`@tailwindcss/vite` ada di catalog tapi versi PostCSS-nya belum. Tambahkan ke bagian `catalog:` di `pnpm-workspace.yaml`, sejajar dengan entri `@tailwindcss/vite`:

```yaml
  '@tailwindcss/postcss': ^4.1.14
```

- [ ] **Step 3: Konfigurasi PostCSS dan Next**

Buat `artifacts/swipe-fashion-next/postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Buat `artifacts/swipe-fashion-next/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lib/db adalah paket workspace berisi TypeScript mentah, jadi Next
  // harus mentranspilasinya alih-alih memperlakukannya sebagai dependency siap pakai.
  transpilePackages: ["@workspace/db"],
};

export default nextConfig;
```

- [ ] **Step 4: Konfigurasi TypeScript**

Buat `artifacts/swipe-fashion-next/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "lib": ["esnext", "dom", "dom.iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "isolatedModules": true,
    "incremental": true,
    "types": ["node"],
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next"]
}
```

Perhatikan `@/*` memetakan ke `./*`, bukan `./src/*`. App Router menaruh `app/`, `lib/`, dan `components/` di root package, sehingga `@/components/ui/button` tetap terselesaikan seperti di aplikasi lama.

- [ ] **Step 5: Salin utils**

Run: `cp artifacts/swipe-fashion/src/lib/utils.ts artifacts/swipe-fashion-next/lib/utils.ts`

Isinya `cn()` — tidak ada yang perlu diubah.

- [ ] **Step 6: Salin globals.css dan sesuaikan font**

Run: `cp artifacts/swipe-fashion/src/index.css artifacts/swipe-fashion-next/app/globals.css`

Lalu lakukan tepat dua perubahan pada file hasil salinan.

Pertama, **hapus baris pertama** seluruhnya:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
```

Kedua, di blok `:root`, ganti dua baris ini:

```css
  --app-font-sans: 'DM Sans', sans-serif;
  --app-font-serif: 'Playfair Display', serif;
```

menjadi:

```css
  --app-font-sans: var(--font-dm-sans), sans-serif;
  --app-font-serif: var(--font-playfair), serif;
```

Semua sisanya — seluruh nilai HSL di `:root` dan `.dark`, blok `@theme inline`, `@layer base`, dan util `.no-scrollbar` — **tidak boleh disentuh**.

- [ ] **Step 7: Tulis root layout**

Buat `artifacts/swipe-fashion-next/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SwipeFash - Fashion Swipe Store",
  description:
    "Swipe through curated fashion. Find the piece, order it in two taps.",
  openGraph: {
    title: "SwipeFash - Fashion Swipe Store",
    description:
      "Swipe through curated fashion. Find the piece, order it in two taps.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

`TooltipProvider` dan `Toaster` ditambahkan di Task 5, setelah komponennya ada.

- [ ] **Step 8: Halaman sementara untuk membuktikan font dan token aktif**

Buat `artifacts/swipe-fashion-next/app/page.tsx`:

```tsx
export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground p-10 space-y-4">
      <h1 className="font-serif text-4xl">Playfair Display heading</h1>
      <p className="font-sans text-muted-foreground">
        DM Sans body text on the app background token.
      </p>
    </main>
  );
}
```

- [ ] **Step 9: Install dependency**

Run: `pnpm install`

Expected: selesai tanpa error. Bila ada penolakan karena `minimumReleaseAge`, **jangan** menonaktifkan setelan itu — laporkan ke user dan pakai versi yang sedikit lebih lama.

- [ ] **Step 10: Verifikasi build**

Run: `cd artifacts/swipe-fashion-next && pnpm run build`

Expected: build sukses, `/` terdaftar sebagai route statis.

- [ ] **Step 11: Verifikasi tampilan**

Run: `cd artifacts/swipe-fashion-next && pnpm run dev`

Buka `http://localhost:20100`. Yang harus terlihat: latar hampir hitam (`hsl(0 0% 5%)`), teks hampir putih, judul berhuruf serif Playfair, paragraf DM Sans berwarna abu. Bila latarnya putih, `globals.css` tidak termuat. Bila fontnya font sistem, variabel `next/font` tidak sampai ke `:root`.

- [ ] **Step 12: Commit**

```bash
git add artifacts/swipe-fashion-next pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(next): scaffold Next.js app with design tokens and fonts"
```

---

### Task 4: Pindahkan aset dan komponen shadcn

**Files:**
- Create: `artifacts/swipe-fashion-next/public/` (dari `attached_assets/` dan `public/` lama)
- Create: `artifacts/swipe-fashion-next/components/ui/` (10 file)
- Create: `artifacts/swipe-fashion-next/hooks/use-toast.ts`

**Interfaces:**
- Produces: `Button`, `Badge`, `Card`, `Input`, `Label`, `Skeleton`, `Tooltip`, `Drawer`, `Toaster`, `useToast` — semua di bawah `@/components/ui/*` dan `@/hooks/use-toast`, dengan nama ekspor persis seperti aplikasi lama.

**Konteks:** Aplikasi lama punya 55 file di `components/ui`, hasil scaffold shadcn. Hanya 9 yang benar-benar di-import kode aplikasi, plus `toast` sebagai dependensi `toaster`. Sisanya tidak dibawa. `use-mobile` juga tidak dibawa karena satu-satunya pemakainya adalah `sidebar` yang tidak terpakai.

Di App Router semua komponen adalah Server Component secara default. Komponen shadcn memakai hook React dan Radix, jadi butuh direktif `'use client'` di baris pertama.

- [ ] **Step 1: Salin aset publik**

```bash
mkdir -p artifacts/swipe-fashion-next/public/assets
cp artifacts/swipe-fashion/public/favicon.svg artifacts/swipe-fashion-next/public/
cp artifacts/swipe-fashion/public/robots.txt artifacts/swipe-fashion-next/public/
cp -R attached_assets/. artifacts/swipe-fashion-next/public/assets/
```

- [ ] **Step 2: Verifikasi aset**

Run: `ls artifacts/swipe-fashion-next/public/assets artifacts/swipe-fashion-next/public/assets/generated_images`

Expected: 12 file `.jpg` pakaian plus `with-is-reference.png` di level atas, dan `hero.jpg`, `product.jpg`, `texture.jpg` di `generated_images/`.

- [ ] **Step 3: Salin 10 file shadcn dan hook toast**

```bash
mkdir -p artifacts/swipe-fashion-next/components/ui artifacts/swipe-fashion-next/hooks
cd artifacts/swipe-fashion/src/components/ui
cp badge.tsx button.tsx card.tsx drawer.tsx input.tsx label.tsx \
   skeleton.tsx toast.tsx toaster.tsx tooltip.tsx \
   ../../../../swipe-fashion-next/components/ui/
cd -
cp artifacts/swipe-fashion/src/hooks/use-toast.ts artifacts/swipe-fashion-next/hooks/
```

- [ ] **Step 4: Tambah direktif use client**

Setiap file berikut harus diawali baris `'use client';` diikuti baris kosong, bila belum ada:

`components/ui/button.tsx`, `card.tsx`, `drawer.tsx`, `input.tsx`, `label.tsx`, `skeleton.tsx`, `toast.tsx`, `toaster.tsx`, `tooltip.tsx`, dan `hooks/use-toast.ts`.

`components/ui/badge.tsx` tidak memakai hook maupun Radix — biarkan sebagai Server Component.

- [ ] **Step 5: Verifikasi typecheck**

Run: `cd artifacts/swipe-fashion-next && pnpm run typecheck`

Expected: nol error. Bila muncul modul tidak ditemukan, berarti ada komponen yang mengimpor file di luar 10 yang disalin — periksa import-nya dan salin file yang kurang.

- [ ] **Step 6: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): port assets and the 10 shadcn files actually used"
```

---

### Task 5: Modul murni — format dan validation, dengan unit test

**Files:**
- Create: `artifacts/swipe-fashion-next/lib/format.ts`
- Create: `artifacts/swipe-fashion-next/lib/validation.ts`
- Test: `artifacts/swipe-fashion-next/lib/format.test.ts`
- Test: `artifacts/swipe-fashion-next/lib/validation.test.ts`
- Create: `artifacts/swipe-fashion-next/vitest.config.ts`

**Interfaces:**
- Consumes: tipe `Product`/`Order` dari `@workspace/db`
- Produces:
  - `type AppProduct` — bentuk produk yang dipakai seluruh UI. Field `price`, `originalPrice`, `rating` bertipe `number | null`, bukan string.
  - `formatProduct(row: DbProduct): AppProduct`
  - `type AppOrder` dengan `product: AppProduct | null`
  - `createOrderSchema` — zod, field: `productId`, `selectedSize`, `selectedColor`, `quantity`
  - `confirmOrderSchema` — zod, field: `paymentMethod`, `shippingAddress`, `customerName`, `customerEmail`

**Konteks:** Kolom `price`, `originalPrice`, `rating`, `totalPrice` bertipe `numeric` di Postgres. Driver `node-postgres` mengembalikannya sebagai **string**, bukan number. UI memanggil `product.price.toFixed(2)` — kalau string, hasilnya crash. Inilah alasan `formatProduct` layak diuji unit.

Berbeda dari API lama, `sessionId` **tidak** ikut di skema. Nilainya diambil server dari cookie, bukan dikirim klien — klien tidak boleh bisa mengaku sebagai sesi orang lain.

- [ ] **Step 1: Tulis test yang gagal untuk format**

Buat `artifacts/swipe-fashion-next/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { formatProduct } from "./format";

const row = {
  id: 1,
  name: "Camel Wool Overcoat",
  brand: "ATELIER SUD",
  price: "620.00",
  originalPrice: null,
  description: "Double-faced wool.",
  imageUrl: "/assets/coat-camel.jpg",
  images: [],
  category: "outerwear",
  sizes: ["S", "M"],
  colors: ["Beige"],
  stock: 5,
  rating: "4.90",
  reviewCount: 87,
  isNew: true,
  isSale: false,
  createdAt: new Date("2026-01-01"),
};

describe("formatProduct", () => {
  it("converts numeric columns from string to number", () => {
    const product = formatProduct(row);

    expect(product.price).toBe(620);
    expect(product.rating).toBe(4.9);
    expect(typeof product.price).toBe("number");
  });

  it("keeps null numerics as null instead of NaN", () => {
    const product = formatProduct(row);

    expect(product.originalPrice).toBeNull();
  });

  it("survives .toFixed(2), which the UI calls on every price", () => {
    const product = formatProduct(row);

    expect(product.price.toFixed(2)).toBe("620.00");
  });
});
```

- [ ] **Step 2: Tulis test yang gagal untuk validation**

Buat `artifacts/swipe-fashion-next/lib/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createOrderSchema } from "./validation";

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

  it("rejects a sessionId supplied by the client", () => {
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
});
```

- [ ] **Step 3: Konfigurasi vitest**

Buat `artifacts/swipe-fashion-next/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Jalankan test untuk memastikan gagal**

Run: `cd artifacts/swipe-fashion-next && pnpm run test`

Expected: FAIL — `Failed to resolve import "./format"` dan `"./validation"`.

- [ ] **Step 5: Tulis format.ts**

Buat `artifacts/swipe-fashion-next/lib/format.ts`:

```ts
import type { Order, Product } from "@workspace/db";

export type AppProduct = {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  description: string;
  imageUrl: string;
  images: string[];
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number | null;
  reviewCount: number;
  isNew: boolean;
  isSale: boolean;
  createdAt: Date;
};

export type AppOrder = {
  id: number;
  sessionId: string;
  productId: number;
  product: AppProduct | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  totalPrice: number;
  status: Order["status"];
  paymentMethod: string | null;
  paymentStatus: Order["paymentStatus"];
  shippingAddress: string | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Kolom numeric Postgres kembali sebagai string lewat node-postgres.
// UI memanggil .toFixed(2) pada harga, jadi konversinya wajib di sini.
function toNumber(value: string | null): number | null {
  return value === null ? null : parseFloat(value);
}

export function formatProduct(row: Product): AppProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: parseFloat(row.price),
    originalPrice: toNumber(row.originalPrice),
    description: row.description,
    imageUrl: row.imageUrl,
    images: row.images ?? [],
    category: row.category,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: row.stock,
    rating: toNumber(row.rating),
    reviewCount: row.reviewCount,
    isNew: row.isNew,
    isSale: row.isSale,
    createdAt: row.createdAt,
  };
}

export function formatOrder(row: Order, product: Product | null): AppOrder {
  return {
    id: row.id,
    sessionId: row.sessionId,
    productId: row.productId,
    product: product ? formatProduct(product) : null,
    selectedSize: row.selectedSize,
    selectedColor: row.selectedColor,
    quantity: row.quantity,
    totalPrice: parseFloat(row.totalPrice),
    status: row.status,
    paymentMethod: row.paymentMethod ?? null,
    paymentStatus: row.paymentStatus,
    shippingAddress: row.shippingAddress ?? null,
    customerName: row.customerName ?? null,
    customerEmail: row.customerEmail ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
```

- [ ] **Step 6: Tulis validation.ts**

Buat `artifacts/swipe-fashion-next/lib/validation.ts`:

```ts
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

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
```

- [ ] **Step 7: Jalankan test sampai lulus**

Run: `cd artifacts/swipe-fashion-next && pnpm run test`

Expected: PASS, 6 test lulus.

- [ ] **Step 8: Commit**

```bash
git add artifacts/swipe-fashion-next/lib artifacts/swipe-fashion-next/vitest.config.ts artifacts/swipe-fashion-next/package.json
git commit -m "feat(next): add pure format and validation modules with unit tests"
```

---

### Task 6: Lapisan baca data

**Files:**
- Create: `artifacts/swipe-fashion-next/lib/data.ts`

**Interfaces:**
- Consumes: `formatProduct`, `formatOrder`, `AppProduct`, `AppOrder` (Task 5); `db` (Task 1)
- Produces:
  - `listProducts({ category?, cursor?, limit? }): Promise<{ products: AppProduct[]; nextCursor: number | null; total: number }>`
  - `getProduct(id: number): Promise<AppProduct | null>`
  - `listCategories(): Promise<{ id: number; name: string; slug: string; productCount: number }[]>`
  - `listOrders(sessionId: string): Promise<AppOrder[]>`

**Konteks:** Ini port langsung dari route Express, dengan dua koreksi.

`categories.ts:16` lama memanggil `db.$count(productsTable)` di dalam `select` yang punya `where`. Subquery hitungnya tidak ikut ter-filter, jadi setiap kategori melaporkan jumlah seluruh produk. Versi ini memakai `count()` dari `drizzle-orm` yang benar-benar menghormati `where`.

Route lama juga menjalankan satu query terpisah per kategori dan per order di dalam `Promise.all`. Untuk 4 kategori dan sedikit order itu tidak fatal, tapi `listOrders` di sini memakai satu `leftJoin` alih-alih N+1 query.

- [ ] **Step 1: Tulis data.ts**

Buat `artifacts/swipe-fashion-next/lib/data.ts`:

```ts
import "server-only";

import { and, asc, count, eq, gt } from "drizzle-orm";
import {
  categoriesTable,
  db,
  ordersTable,
  productsTable,
} from "@workspace/db";

import { formatOrder, formatProduct } from "./format";
import type { AppOrder, AppProduct } from "./format";

export async function listProducts({
  category,
  cursor,
  limit = 10,
}: {
  category?: string;
  cursor?: number;
  limit?: number;
} = {}): Promise<{
  products: AppProduct[];
  nextCursor: number | null;
  total: number;
}> {
  const conditions = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (cursor) conditions.push(gt(productsTable.id, cursor));

  // Ambil satu lebih banyak dari limit untuk tahu apakah masih ada halaman berikutnya.
  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(productsTable.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const [totalRow] = await db
    .select({ value: count() })
    .from(productsTable)
    .where(category ? eq(productsTable.category, category) : undefined);

  return {
    products: items.map(formatProduct),
    nextCursor: hasMore ? items[items.length - 1].id : null,
    total: Number(totalRow?.value ?? 0),
  };
}

export async function getProduct(id: number): Promise<AppProduct | null> {
  const [row] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));

  return row ? formatProduct(row) : null;
}

export async function listCategories(): Promise<
  { id: number; name: string; slug: string; productCount: number }[]
> {
  // Satu query dengan group by, menggantikan satu query per kategori.
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      productCount: count(productsTable.id),
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.category, categoriesTable.slug))
    .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.slug)
    .orderBy(asc(categoriesTable.name));

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}

export async function listOrders(sessionId: string): Promise<AppOrder[]> {
  const rows = await db
    .select({ order: ordersTable, product: productsTable })
    .from(ordersTable)
    .leftJoin(productsTable, eq(productsTable.id, ordersTable.productId))
    .where(eq(ordersTable.sessionId, sessionId))
    .orderBy(asc(ordersTable.createdAt));

  return rows.map((row) => formatOrder(row.order, row.product));
}
```

- [ ] **Step 2: Tambah dependency server-only dan drizzle-orm**

Tambahkan keduanya ke `dependencies` di `artifacts/swipe-fashion-next/package.json`:

```json
"drizzle-orm": "catalog:",
"server-only": "^0.0.1"
```

Lalu run: `pnpm install`

`server-only` membuat build gagal bila modul ini tidak sengaja terimpor Client Component — itu jaring pengaman supaya kredensial database tidak pernah bocor ke bundel browser.

`drizzle-orm` wajib didaftarkan langsung meskipun sudah menjadi dependency `@workspace/db`. pnpm memakai `node_modules` yang ketat, jadi paket tidak bisa dipinjam secara transitif; tanpa ini `tsc` gagal dengan `TS2307: Cannot find module 'drizzle-orm'`.

- [ ] **Step 3: Verifikasi typecheck**

Run: `cd artifacts/swipe-fashion-next && pnpm run typecheck`

Expected: nol error.

- [ ] **Step 4: Verifikasi query sungguhan jalan**

Ganti sementara isi `app/page.tsx`:

```tsx
import { listCategories, listProducts } from "@/lib/data";

export default async function Page() {
  const [feed, categories] = await Promise.all([
    listProducts({ limit: 3 }),
    listCategories(),
  ]);

  return (
    <main className="min-h-dvh bg-background text-foreground p-10">
      <pre className="text-xs">
        {JSON.stringify({ feed, categories }, null, 2)}
      </pre>
    </main>
  );
}
```

Run: `cd artifacts/swipe-fashion-next && pnpm run dev`

Buka `http://localhost:20100`. Expected: JSON berisi 3 produk dengan `price` sebagai **angka** (`620` bukan `"620.00"`), `total` bernilai 12, dan 4 kategori dengan `productCount` masing-masing 2, 3, 3, 4 — **bukan** 12 semua. Bila semuanya 12, bug `$count` lama ikut terbawa.

- [ ] **Step 5: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): add server-side data layer, fixing per-category count"
```

---

### Task 7: Layout aplikasi, navigasi bawah, dan halaman 404

**Files:**
- Create: `artifacts/swipe-fashion-next/components/layout.tsx`
- Create: `artifacts/swipe-fashion-next/app/not-found.tsx`
- Modify: `artifacts/swipe-fashion-next/app/layout.tsx`

**Interfaces:**
- Consumes: `cn` dari `@/lib/utils`
- Produces: `AppLayout({ children })` dan `BottomNav()` dari `@/components/layout`, dengan markup dan kelas persis seperti aplikasi lama.

**Konteks:** `BottomNav` lama memakai `useLocation()` dari wouter untuk menandai tab aktif. Padanannya `usePathname()` dari `next/navigation`. Karena memakai hook, komponen ini Client Component. `AppLayout` sendiri tidak memakai hook, tapi ikut di file yang sama, jadi seluruh file ditandai `'use client'`.

- [ ] **Step 1: Tulis components/layout.tsx**

Buat `artifacts/swipe-fashion-next/components/layout.tsx`:

```tsx
"use client";

import { GalleryVerticalEnd, Layers, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/" && "text-foreground",
          )}
        >
          <Layers className="w-6 h-6" strokeWidth={pathname === "/" ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Feed
          </span>
        </Link>
        <Link
          href="/lookbook"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/lookbook" && "text-foreground",
          )}
        >
          <GalleryVerticalEnd
            className="w-6 h-6"
            strokeWidth={pathname === "/lookbook" ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Lookbook
          </span>
        </Link>
        <Link
          href="/orders"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/orders" && "text-foreground",
          )}
        >
          <ShoppingBag
            className="w-6 h-6"
            strokeWidth={pathname === "/orders" ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Bag
          </span>
        </Link>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative overflow-hidden">
      <main className="flex-1 w-full max-w-md mx-auto relative pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Pasang provider di root layout**

Di `artifacts/swipe-fashion-next/app/layout.tsx`, tambahkan import:

```tsx
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
```

lalu ganti isi `<body>`:

```tsx
      <body>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
```

- [ ] **Step 3: Tulis halaman 404 bertema gelap**

Buat `artifacts/swipe-fashion-next/app/not-found.tsx`:

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col items-center justify-center px-8 text-center">
      <p className="font-serif text-6xl mb-4">404</p>
      <h1 className="font-serif text-2xl mb-3">This piece isn&apos;t here.</h1>
      <p className="text-muted-foreground text-sm max-w-[280px] mb-8">
        The page you were looking for has moved or never existed.
      </p>
      <Button asChild className="h-12 rounded-full px-8">
        <Link href="/">Back to the feed</Link>
      </Button>
    </div>
  );
}
```

Versi lama memakai `bg-gray-50` dan `text-gray-900` — terang di aplikasi bertema gelap — dengan teks "Did you forget to add the page to the router?" yang ditujukan ke developer. Versi ini memakai token tema yang sama dengan halaman lain.

- [ ] **Step 4: Verifikasi**

Run: `cd artifacts/swipe-fashion-next && pnpm run dev`

Buka `http://localhost:20100/halaman-yang-tidak-ada`. Expected: latar gelap, angka 404 berhuruf serif, tombol bulat kembali ke feed yang benar-benar berfungsi.

- [ ] **Step 5: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): add app layout, bottom nav, and themed 404 page"
```

---

### Task 8: Halaman landing

**Files:**
- Create: `artifacts/swipe-fashion-next/app/welcome/page.tsx`

**Interfaces:**
- Produces: rute `/welcome`. Tanpa akses data.

**Konteks:** `artifacts/swipe-fashion/src/pages/landing.tsx` panjangnya 384 baris dan sepenuhnya statis. Ini port paling harfiah dalam plan ini — **salin isinya apa adanya**, lalu lakukan hanya penyesuaian di bawah. Jangan menulis ulang markup atau merapikan kelas Tailwind; kemiripan visual adalah kriteria keberhasilan task ini.

- [ ] **Step 1: Salin file**

Run: `cp artifacts/swipe-fashion/src/pages/landing.tsx artifacts/swipe-fashion-next/app/welcome/page.tsx`

- [ ] **Step 2: Ganti import gambar**

Hapus tiga baris import di bagian atas:

```tsx
import heroImg from '@assets/generated_images/hero.jpg';
import productImg from '@assets/generated_images/product.jpg';
import textureImg from '@assets/generated_images/texture.jpg';
```

Alias `@assets` tidak ada di Next. Gambar sekarang ada di `public/`, jadi rujuk lewat path string. Ganti dengan:

```tsx
const heroImg = "/assets/generated_images/hero.jpg";
const productImg = "/assets/generated_images/product.jpg";
const textureImg = "/assets/generated_images/texture.jpg";
```

Semua pemakaian `{heroImg}` di JSX tetap bekerja tanpa diubah.

- [ ] **Step 3: Ganti import Link**

Ganti `import { Link } from 'wouter';` menjadi `import Link from 'next/link';`

Prop `href` sama, tidak ada JSX yang perlu diubah.

- [ ] **Step 4: Tandai sebagai Client Component bila perlu**

Periksa apakah file memakai `useState`, `useEffect`, atau handler `onClick`:

Run: `grep -n "useState\|useEffect\|onClick\|framer-motion" artifacts/swipe-fashion-next/app/welcome/page.tsx`

Bila ada hasil, tambahkan `"use client";` di baris paling atas. Bila tidak ada, biarkan sebagai Server Component — halaman jadi sepenuhnya statis dan itu lebih baik.

- [ ] **Step 5: Verifikasi berdampingan**

Jalankan kedua aplikasi:

```bash
pnpm --filter @workspace/swipe-fashion run dev    # aplikasi lama
cd artifacts/swipe-fashion-next && pnpm run dev   # aplikasi baru
```

Buka `/welcome` di kedua aplikasi pada lebar viewport 390px. Bandingkan: gambar hero, ukuran dan pemenggalan baris judul, jarak antar bagian, gaya tombol. Perbedaan apa pun harus dilacak sampai ketemu penyebabnya sebelum lanjut.

- [ ] **Step 6: Commit**

```bash
git add artifacts/swipe-fashion-next/app/welcome
git commit -m "feat(next): port landing page"
```

---

### Task 9: Halaman lookbook dengan filter lewat URL

**Files:**
- Create: `artifacts/swipe-fashion-next/app/lookbook/page.tsx`

**Interfaces:**
- Consumes: `listCategories`, `listProducts` (Task 6); `AppLayout` (Task 7)
- Produces: rute `/lookbook`, menerima `?category=<slug>`

**Konteks:** Versi lama menyimpan kategori aktif di `useState` dan mengambil data di klien, dengan skeleton saat loading. Versi ini memindahkan filter ke URL: tombolnya jadi `<Link>`, halamannya Server Component. Hasilnya bisa dibagikan, bisa di-index, dan tidak ada skeleton karena HTML sudah datang lengkap.

Kelas Tailwind untuk tombol dan kartu produk disalin persis dari versi lama supaya tampilannya identik.

- [ ] **Step 1: Tulis halaman**

Buat `artifacts/swipe-fashion-next/app/lookbook/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppLayout } from "@/components/layout";
import { listCategories, listProducts } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lookbook | SwipeFash",
  description: "Browse the full collection by category.",
};

const tabClass = (active: boolean) =>
  cn(
    "px-5 py-2 rounded-full text-xs font-medium uppercase tracking-widest whitespace-nowrap transition-all border",
    active
      ? "bg-foreground text-background border-foreground"
      : "bg-transparent text-muted-foreground border-border hover:border-foreground/50",
  );

export default async function LookbookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [categories, feed] = await Promise.all([
    listCategories(),
    listProducts({ category, limit: 50 }),
  ]);

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20">
          <h1 className="font-serif text-4xl mb-4">Lookbook</h1>

          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-6 px-6">
            <Link href="/lookbook" className={tabClass(!category)}>
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/lookbook?category=${cat.slug}`}
                className={tabClass(category === cat.slug)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </header>

        <div className="px-4 pb-8 pt-2">
          {feed.products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {feed.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-muted">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 448px) 50vw, 224px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <div className="absolute top-2 right-2 bg-background text-foreground text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm">
                        New
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    {product.brand}
                  </p>
                  <h3 className="font-medium text-sm mb-1 leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="font-serif text-sm">
                    ${product.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 2: Verifikasi render di server**

Run: `cd artifacts/swipe-fashion-next && pnpm run build && pnpm run start`

Lalu: `curl -s http://localhost:20100/lookbook | grep -c "Burgundy Silk Slip Dress"`

Expected: `1` atau lebih. Nama produk harus ada di HTML mentah — itu bukti render terjadi di server, bukan di browser.

- [ ] **Step 3: Verifikasi filter**

Run: `curl -s "http://localhost:20100/lookbook?category=dresses" | grep -c "Camel Wool Overcoat"`

Expected: `0`. Mantel tidak boleh muncul saat filter dresses aktif.

- [ ] **Step 4: Verifikasi berdampingan**

Buka `/lookbook` di kedua aplikasi pada viewport 390px. Bandingkan grid dua kolom, rasio gambar, jarak antar kartu, gaya tab, dan badge "New". Klik tiap tab kategori dan bandingkan hasilnya.

- [ ] **Step 5: Commit**

```bash
git add artifacts/swipe-fashion-next/app/lookbook
git commit -m "feat(next): port lookbook with URL-driven category filter"
```

---

### Task 10: Halaman detail produk dengan metadata SEO

**Files:**
- Create: `artifacts/swipe-fashion-next/app/product/[id]/page.tsx`
- Create: `artifacts/swipe-fashion-next/components/product-detail-actions.tsx`

**Interfaces:**
- Consumes: `getProduct` (Task 6); `OrderSheet` (Task 12 — sementara di-stub di task ini)
- Produces: rute `/product/[id]` dan `generateMetadata`

**Konteks:** Inilah alasan utama migrasi ini dikerjakan. Halaman ini menghasilkan tag OpenGraph dan title per produk supaya bisa di-index dan tampil layak ketika dibagikan.

Isi halaman sepenuhnya statis kecuali tombol "Add to Bag" yang membuka drawer. Bagian interaktif itu dipisah ke `product-detail-actions.tsx` supaya sisa halamannya tetap Server Component.

Halaman ini tidak memakai `AppLayout` — versi lama juga tidak. Ia punya tombol kembali sendiri dan bar bawah yang menempel.

- [ ] **Step 1: Stub komponen aksi**

Buat `artifacts/swipe-fashion-next/components/product-detail-actions.tsx`. Versi sementara ini akan dilengkapi di Task 12 setelah `OrderSheet` ada:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import type { AppProduct } from "@/lib/format";

export function ProductDetailActions({ product }: { product: AppProduct }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="max-w-md mx-auto p-4 flex gap-4">
        <Button
          className="flex-1 h-14 rounded-full text-lg font-medium"
          data-testid="button-open-order-sheet"
        >
          Add to Bag
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tulis halaman produk**

Buat `artifacts/swipe-fashion-next/app/product/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info, Star } from "lucide-react";

import { ProductDetailActions } from "@/components/product-detail-actions";
import { getProduct } from "@/lib/data";

async function loadProduct(rawId: string) {
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) return null;
  return getProduct(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    return { title: "Product not found | SwipeFash" };
  }

  const title = `${product.name} by ${product.brand} | SwipeFash`;

  return {
    title,
    description: product.description,
    openGraph: {
      title,
      description: product.description,
      type: "website",
      images: [{ url: product.imageUrl, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) notFound();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative max-w-md mx-auto">
      <Link
        href="/lookbook"
        className="absolute top-safe-8 left-4 z-50 rounded-full w-10 h-10 bg-background/50 backdrop-blur-md border-0 text-foreground flex items-center justify-center hover:bg-background/70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </Link>

      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        <div className="relative w-full h-[65vh] bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/0 to-transparent pointer-events-none" />
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-card border border-card-border p-6 rounded-3xl shadow-xl space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                {product.brand}
              </p>
              <h1 className="font-serif text-3xl leading-tight mb-3">
                {product.name}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-2xl">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-muted-foreground line-through text-sm">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium text-foreground">
                      {product.rating}
                    </span>
                    <span className="text-muted-foreground">
                      ({product.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Details
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                <Info className="w-4 h-4 shrink-0" />
                <p>
                  Free standard shipping on orders over $200. Free returns
                  within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductDetailActions product={product} />
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi metadata benar-benar ter-render di server**

Run: `cd artifacts/swipe-fashion-next && pnpm run build && pnpm run start`

Lalu: `curl -s http://localhost:20100/product/1 | grep -o '<title>[^<]*</title>'`

Expected: `<title>Burgundy Silk Slip Dress by MAISON NOIR | SwipeFash</title>`

- [ ] **Step 4: Verifikasi tag OpenGraph**

Run: `curl -s http://localhost:20100/product/1 | grep 'og:'`

Expected: ada `og:title`, `og:description`, dan `og:image` yang menunjuk ke gambar produk.

- [ ] **Step 5: Verifikasi 404**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:20100/product/9999`

Expected: `404`

- [ ] **Step 6: Verifikasi berdampingan**

Buka `/product/1` di kedua aplikasi pada viewport 390px. Bandingkan tinggi gambar hero, gradien di atasnya, kartu yang menumpuk naik (`-mt-12`), radius sudut, dan bar bawah. Ini titik paling berisiko karena `<img>` berganti `next/image`.

- [ ] **Step 7: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): port product page with per-product SEO metadata"
```

---

### Task 11: Cookie sesi dan Server Actions

**Files:**
- Create: `artifacts/swipe-fashion-next/lib/session-cookie.ts`
- Create: `artifacts/swipe-fashion-next/middleware.ts`
- Create: `artifacts/swipe-fashion-next/lib/session.ts`
- Create: `artifacts/swipe-fashion-next/app/actions.ts`

**Interfaces:**
- Consumes: `createOrderSchema`, `confirmOrderSchema` (Task 5); `db` (Task 1)
- Produces:
  - `getSessionId(): Promise<string>` dari `@/lib/session`
  - `createOrderAction(input): Promise<ActionResult>` dari `@/app/actions`
  - `confirmOrderAction(orderId, input): Promise<ActionResult>`
  - `cancelOrderAction(orderId): Promise<ActionResult>`
  - `type ActionResult = { ok: true } | { ok: false; error: string }`

**Konteks:** Aplikasi lama membuat UUID sesi di `useSession` dan menyimpannya di localStorage, lalu mengirimkannya di body setiap request. Server tidak punya cara membacanya, jadi `/orders` tidak bisa di-render di server.

Sekarang middleware yang menetapkan cookie. Karena `httpOnly`, JavaScript di browser tidak bisa membacanya — dan Server Action tidak lagi menerima `sessionId` dari klien, sehingga tidak ada yang bisa mengaku sebagai sesi orang lain.

Task ini juga memperbaiki bug pengembalian stok. Kode lama menulis ``db.sql`...` `` yang bukan API Drizzle yang valid, sehingga pembatalan order kemungkinan besar melempar error saat dijalankan. Versi ini memakai `sql` yang di-import dari `drizzle-orm`.

- [ ] **Step 1: Tulis konstanta nama cookie**

Buat `artifacts/swipe-fashion-next/lib/session-cookie.ts`:

```ts
// Modul ini sengaja tidak mengimpor apa pun. Middleware berjalan di edge
// runtime sedangkan lib/session.ts ditandai server-only; kalau keduanya
// saling impor, kode edge bisa tertarik ke Server Component. Konstanta
// yang berdiri sendiri aman dipakai kedua sisi.
export const SESSION_COOKIE = "swipefash_session";
```

- [ ] **Step 2: Tulis middleware**

Buat `artifacts/swipe-fashion-next/middleware.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  // Lewati aset statis — tiap request gambar tidak perlu melewati middleware.
  matcher: ["/((?!_next/static|_next/image|assets|favicon.svg|robots.txt).*)"],
};
```

- [ ] **Step 3: Tulis helper sesi**

Buat `artifacts/swipe-fashion-next/lib/session.ts`:

```ts
import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function getSessionId(): Promise<string> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;

  // Middleware menetapkan cookie ini pada request pertama. Kalau tidak ada,
  // berarti request lolos dari matcher — kembalikan string kosong supaya
  // pemanggil menampilkan keadaan kosong, bukan crash.
  return value ?? "";
}
```

- [ ] **Step 4: Tulis Server Actions**

Buat `artifacts/swipe-fashion-next/app/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";

import { getSessionId } from "@/lib/session";
import {
  confirmOrderSchema,
  createOrderSchema,
  type ConfirmOrderInput,
  type CreateOrderInput,
} from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid order details." };
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    return { ok: false, error: "No active session." };
  }

  const { productId, selectedSize, selectedColor, quantity } = parsed.data;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    return { ok: false, error: "Product not found." };
  }

  if (product.stock < quantity) {
    return { ok: false, error: "Insufficient stock." };
  }

  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  await db.insert(ordersTable).values({
    sessionId,
    productId,
    selectedSize,
    selectedColor,
    quantity,
    totalPrice,
    status: "pending",
    paymentStatus: "unpaid",
  });

  await db
    .update(productsTable)
    .set({ stock: product.stock - quantity })
    .where(eq(productsTable.id, productId));

  revalidatePath("/orders");
  return { ok: true };
}

export async function confirmOrderAction(
  orderId: number,
  input: ConfirmOrderInput,
): Promise<ActionResult> {
  const parsed = confirmOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid confirmation details." };
  }

  const sessionId = await getSessionId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  // Cek kepemilikan: sesi hanya boleh menyentuh order miliknya sendiri.
  if (!existing || existing.sessionId !== sessionId) {
    return { ok: false, error: "Order not found." };
  }

  await db
    .update(ordersTable)
    .set({
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: parsed.data.paymentMethod,
      shippingAddress: parsed.data.shippingAddress,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId));

  revalidatePath("/orders");
  return { ok: true };
}

export async function cancelOrderAction(
  orderId: number,
): Promise<ActionResult> {
  const sessionId = await getSessionId();

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));

  if (!existing || existing.sessionId !== sessionId) {
    return { ok: false, error: "Order not found." };
  }

  if (existing.status !== "cancelled") {
    // Versi Express memakai db.sql yang bukan API Drizzle yang valid,
    // sehingga pengembalian stok melempar error. sql di-import dari drizzle-orm.
    await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} + ${existing.quantity}` })
      .where(eq(productsTable.id, existing.productId));
  }

  await db
    .update(ordersTable)
    .set({
      status: "cancelled",
      paymentStatus: existing.paymentStatus === "paid" ? "refunded" : "unpaid",
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId));

  revalidatePath("/orders");
  return { ok: true };
}
```

- [ ] **Step 5: Verifikasi cookie ditetapkan**

Run: `cd artifacts/swipe-fashion-next && pnpm run dev`

Lalu: `curl -si http://localhost:20100/ | grep -i "set-cookie"`

Expected: satu header `set-cookie` berisi `swipefash_session=<uuid>` dengan flag `HttpOnly` dan `Path=/`.

- [ ] **Step 6: Verifikasi cookie tidak diulang**

```bash
curl -s -c /tmp/swipefash-cookies.txt http://localhost:20100/ > /dev/null
curl -si -b /tmp/swipefash-cookies.txt http://localhost:20100/ | grep -ci "set-cookie"
```

Expected: `0`. Cookie hanya ditetapkan sekali; kunjungan berikutnya memakai yang sudah ada.

- [ ] **Step 7: Verifikasi typecheck**

Run: `cd artifacts/swipe-fashion-next && pnpm run typecheck`

Expected: nol error.

- [ ] **Step 8: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): add session cookie and server actions

Pengembalian stok saat pembatalan ditulis ulang memakai sql dari drizzle-orm.
Versi Express memakai db.sql yang bukan API valid, sehingga melempar error."
```

---

### Task 12: Komponen OrderSheet

**Files:**
- Create: `artifacts/swipe-fashion-next/components/order-sheet.tsx`
- Modify: `artifacts/swipe-fashion-next/components/product-detail-actions.tsx`

**Interfaces:**
- Consumes: `createOrderAction` (Task 11); `AppProduct` (Task 5); komponen `Drawer` (Task 4)
- Produces: `OrderSheet({ product, isOpen, onOpenChange, onSuccess })` — signature prop sama persis dengan versi lama.

**Konteks:** Port dari `artifacts/swipe-fashion/src/components/order-sheet.tsx`. Seluruh markup, kelas Tailwind, peta warna, dan teks toast dipertahankan sama.

Yang berubah hanya lapisan mutasinya: `useCreateOrder()` dari TanStack Query diganti pemanggilan Server Action di dalam `useTransition`. `useSession()` hilang sepenuhnya — server yang tahu sesinya.

- [ ] **Step 1: Tulis OrderSheet**

Buat `artifacts/swipe-fashion-next/components/order-sheet.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { createOrderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import type { AppProduct } from "@/lib/format";
import { cn } from "@/lib/utils";

interface OrderSheetProps {
  product: AppProduct | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const colorMap: Record<string, string> = {
  Black: "#000000",
  White: "#ffffff",
  Beige: "#f5f5dc",
  Navy: "#000080",
  Grey: "#808080",
  Red: "#ff0000",
  Blue: "#0000ff",
  Green: "#008000",
  Brown: "#a52a2a",
  Pink: "#ffc0cb",
  Yellow: "#ffff00",
  Purple: "#800080",
};

export function OrderSheet({
  product,
  isOpen,
  onOpenChange,
  onSuccess,
}: OrderSheetProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  if (product && isOpen && !selectedSize && product.sizes.length > 0) {
    setSelectedSize(product.sizes[0]);
  }
  if (product && isOpen && !selectedColor && product.colors.length > 0) {
    setSelectedColor(product.colors[0]);
  }

  const handleConfirm = () => {
    if (!product) return;
    if (!selectedSize && product.sizes.length > 0) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    if (!selectedColor && product.colors.length > 0) {
      toast({ title: "Please select a color", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        productId: product.id,
        selectedSize: selectedSize || "N/A",
        selectedColor: selectedColor || "N/A",
        quantity: 1,
      });

      if (!result.ok) {
        toast({
          title: "Error adding to bag",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Added to Bag",
        description: `${product.name} is waiting for you.`,
      });
      onOpenChange(false);
      onSuccess?.();
      setTimeout(() => {
        setSelectedSize("");
        setSelectedColor("");
      }, 300);
    });
  };

  if (!product) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-card-border rounded-t-3xl text-card-foreground">
        <DrawerHeader className="text-left pt-6 pb-2">
          <div className="flex gap-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-24 object-cover rounded-md"
            />
            <div className="flex flex-col justify-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {product.brand}
              </p>
              <DrawerTitle className="text-xl mb-1">{product.name}</DrawerTitle>
              <p className="font-serif text-lg">${product.price.toFixed(2)}</p>
            </div>
          </div>
          <DrawerDescription className="sr-only">
            Select size and color for {product.name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {product.sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Size
                </h4>
                <button className="text-xs underline text-muted-foreground hover:text-foreground">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-12 h-12 rounded-full border border-border flex items-center justify-center text-sm font-medium transition-all",
                      selectedSize === size
                        ? "bg-foreground text-background border-foreground scale-110"
                        : "hover:border-foreground/50",
                    )}
                    data-testid={`size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Select Color
              </h4>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  const hex = colorMap[color] || color.toLowerCase();

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "group relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        selectedColor === color
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                          : "",
                      )}
                      title={color}
                      data-testid={`color-${color}`}
                    >
                      <span
                        className="w-full h-full rounded-full border border-border"
                        style={{ backgroundColor: hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-2 pb-8">
          <Button
            className="w-full h-14 rounded-full text-lg font-medium"
            onClick={handleConfirm}
            disabled={isPending}
            data-testid="button-confirm-add"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Add to Bag"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

Gambar kecil di header drawer sengaja tetap `<img>`, bukan `next/image`. Ukurannya tetap 80×96px dan ia muncul di dalam drawer yang beranimasi — `next/image` tidak memberi keuntungan di sini dan justru menambah risiko pergeseran tata letak.

- [ ] **Step 2: Lengkapi tombol di halaman produk**

Ganti seluruh isi `artifacts/swipe-fashion-next/components/product-detail-actions.tsx`:

```tsx
"use client";

import { useState } from "react";

import { OrderSheet } from "@/components/order-sheet";
import { Button } from "@/components/ui/button";
import type { AppProduct } from "@/lib/format";

export function ProductDetailActions({ product }: { product: AppProduct }) {
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
        <div className="max-w-md mx-auto p-4 flex gap-4">
          <Button
            className="flex-1 h-14 rounded-full text-lg font-medium"
            onClick={() => setIsOrderSheetOpen(true)}
            data-testid="button-open-order-sheet"
          >
            Add to Bag
          </Button>
        </div>
      </div>

      <OrderSheet
        product={product}
        isOpen={isOrderSheetOpen}
        onOpenChange={setIsOrderSheetOpen}
      />
    </>
  );
}
```

- [ ] **Step 3: Verifikasi alur order sungguhan**

Run: `cd artifacts/swipe-fashion-next && pnpm run dev`

Buka `http://localhost:20100/product/1`, klik "Add to Bag", pilih ukuran dan warna, klik "Add to Bag" di drawer.

Expected: toast "Added to Bag" muncul, drawer menutup.

- [ ] **Step 4: Verifikasi order benar-benar tersimpan**

Run: `psql "$DIRECT_URL" -c "SELECT id, session_id, product_id, selected_size, total_price, status FROM orders;"`

Expected: satu baris, `status` bernilai `pending`, `total_price` bernilai `289.00`.

- [ ] **Step 5: Verifikasi stok berkurang**

Run: `psql "$DIRECT_URL" -c "SELECT stock FROM products WHERE id = 1;"`

Expected: `11` — turun dari 12.

- [ ] **Step 6: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): port order sheet onto server actions"
```

---

### Task 13: Halaman feed dengan swipe

**Files:**
- Create: `artifacts/swipe-fashion-next/components/product-card.tsx`
- Create: `artifacts/swipe-fashion-next/components/swipe-feed.tsx`
- Modify: `artifacts/swipe-fashion-next/app/page.tsx`

**Interfaces:**
- Consumes: `listProducts` (Task 6); `OrderSheet` (Task 12); `AppProduct` (Task 5)
- Produces: rute `/`

**Konteks:** Halaman ini tidak bisa jadi Server Component — ia adalah drag gesture, motion value, dan state indeks. Yang bisa dipindah ke server adalah pengambilan data awalnya.

Jadi `app/page.tsx` menjadi Server Component tipis yang mengambil 10 produk dan mengopernya sebagai prop, sementara `swipe-feed.tsx` memegang seluruh interaksi. Efeknya: `useState` + `useEffect` yang menyinkronkan data di versi lama hilang, dan tidak ada lagi layar "Curating your feed..." pada kunjungan pertama karena kartunya sudah ada di HTML.

Kartu produk tetap memakai `<img>`, bukan `next/image`. Kartu ini di-drag, dirotasi, dan diberi transform oleh framer-motion; membungkusnya dengan wrapper `fill` milik `next/image` adalah risiko visual yang tidak sebanding dengan keuntungannya.

- [ ] **Step 1: Salin product-card dan sesuaikan**

Run: `cp artifacts/swipe-fashion/src/components/product-card.tsx artifacts/swipe-fashion-next/components/product-card.tsx`

Lakukan tepat empat perubahan pada file hasil salinan:

1. Tambahkan `"use client";` di baris paling atas, diikuti baris kosong.
2. Ganti `import { Product } from '@workspace/api-client-react';` menjadi `import type { AppProduct } from '@/lib/format';`
3. Ganti `import { Link } from 'wouter';` menjadi `import Link from 'next/link';`
4. Ganti setiap kemunculan tipe `Product` dengan `AppProduct` — ada di `ProductCardProps` (`product`, `onSwipeRight`, `onSwipeLeft`).

Markup, kelas Tailwind, ambang swipe, dan seluruh nilai motion **tidak boleh diubah**.

- [ ] **Step 2: Tulis komponen feed**

Buat `artifacts/swipe-fashion-next/components/swipe-feed.tsx`:

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch } from "lucide-react";

import { OrderSheet } from "@/components/order-sheet";
import { ProductCard } from "@/components/product-card";
import type { AppProduct } from "@/lib/format";

export function SwipeFeed({ products }: { products: AppProduct[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(
    null,
  );
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  const handleSwipeRight = (product: AppProduct) => {
    setSelectedProduct(product);
    setIsOrderSheetOpen(true);
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  const handleSwipeLeft = () => {
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  const hasMoreProducts = currentIndex < products.length;

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden bg-background">
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-center pointer-events-none">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          SWIPE
          <span className="text-muted-foreground font-normal italic">Fash</span>
        </h1>
      </div>

      <div className="relative w-full h-full pt-16">
        <AnimatePresence>
          {hasMoreProducts ? (
            products
              .slice(currentIndex, currentIndex + 2)
              .map((product, index) => (
                <ProductCard
                  key={`${product.id}-${currentIndex}`}
                  product={product}
                  isFront={index === 0}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              ))
              .reverse()
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pb-24"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <PackageSearch className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-3xl mb-3">
                You&apos;re all caught up.
              </h2>
              <p className="text-muted-foreground text-lg max-w-[250px]">
                Check back later for new arrivals or browse the lookbook.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OrderSheet
        product={selectedProduct}
        isOpen={isOrderSheetOpen}
        onOpenChange={setIsOrderSheetOpen}
      />
    </div>
  );
}
```

- [ ] **Step 3: Tulis halaman feed**

Ganti seluruh isi `artifacts/swipe-fashion-next/app/page.tsx`:

```tsx
import { AppLayout } from "@/components/layout";
import { SwipeFeed } from "@/components/swipe-feed";
import { listProducts } from "@/lib/data";

// Stok dan katalog berubah saat order dibuat, jadi feed tidak boleh
// di-cache statis saat build.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const { products } = await listProducts({ limit: 10 });

  return (
    <AppLayout>
      <SwipeFeed products={products} />
    </AppLayout>
  );
}
```

- [ ] **Step 4: Verifikasi kartu ter-render di server**

Run: `cd artifacts/swipe-fashion-next && pnpm run build && pnpm run start`

Lalu: `curl -s http://localhost:20100/ | grep -c "MAISON NOIR"`

Expected: `1` atau lebih. Kartu pertama sudah ada di HTML — tidak ada layar loading pada kunjungan pertama.

- [ ] **Step 5: Verifikasi swipe berfungsi**

Buka `http://localhost:20100/` di browser pada viewport 390px:
- Geser kartu ke kanan melewati ambang → overlay hijau "BUY" muncul, drawer order terbuka
- Geser ke kiri → overlay merah "PASS" muncul, kartu berikutnya naik
- Klik tombol X dan tombol hati → berperilaku sama dengan geseran
- Habiskan seluruh 10 kartu → muncul layar "You're all caught up."

- [ ] **Step 6: Verifikasi berdampingan**

Buka `/` di kedua aplikasi. Bandingkan tinggi kartu (`h-[70vh]`), radius sudut, gradien di bawah gambar, posisi badge, sudut rotasi saat digeser, dan ukuran tombol aksi.

- [ ] **Step 7: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): port swipe feed with server-rendered initial cards"
```

---

### Task 14: Halaman orders

**Files:**
- Create: `artifacts/swipe-fashion-next/app/orders/page.tsx`
- Create: `artifacts/swipe-fashion-next/components/order-actions.tsx`

**Interfaces:**
- Consumes: `listOrders` (Task 6); `getSessionId` (Task 11); `confirmOrderAction`, `cancelOrderAction` (Task 11); `AppOrder` (Task 5)
- Produces: rute `/orders`

**Konteks:** Baca ulang `artifacts/swipe-fashion/src/pages/orders.tsx` (252 baris) sebelum mulai — markup, kelas, badge status, dan teks toast harus dipertahankan.

Struktur barunya: halaman jadi Server Component yang membaca cookie sesi dan mengambil order, sementara tombol Confirm dan Cancel pindah ke `order-actions.tsx` sebagai Client Component. Setelah aksi selesai, `revalidatePath('/orders')` di Server Action membuat halaman ini ter-render ulang sendiri — tidak perlu invalidasi query manual seperti versi TanStack Query.

Halaman ini ditandai `noindex`: isinya personal dan tidak ada gunanya di hasil pencarian.

- [ ] **Step 1: Baca halaman lama**

Run: `cat artifacts/swipe-fashion/src/pages/orders.tsx`

Catat: struktur kartu order, pemetaan warna badge per status, isi keadaan kosong, dan bentuk form konfirmasi.

- [ ] **Step 2: Tulis komponen aksi**

Buat `artifacts/swipe-fashion-next/components/order-actions.tsx`. Komponen ini memegang tombol per order dan form konfirmasi. Field form mengikuti `confirmOrderSchema`: `paymentMethod`, `shippingAddress`, `customerName`, `customerEmail`.

```tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { cancelOrderAction, confirmOrderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AppOrder } from "@/lib/format";

export function OrderActions({ order }: { order: AppOrder }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [form, setForm] = useState({
    paymentMethod: "Card",
    shippingAddress: "",
    customerName: "",
    customerEmail: "",
  });

  if (order.status === "cancelled") return null;

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrderAction(order.id);
      toast(
        result.ok
          ? { title: "Order cancelled" }
          : {
              title: "Could not cancel order",
              description: result.error,
              variant: "destructive",
            },
      );
    });
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmOrderAction(order.id, form);
      if (!result.ok) {
        toast({
          title: "Could not confirm order",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Order confirmed" });
      setIsConfirming(false);
    });
  };

  if (order.status !== "pending") {
    return (
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={handleCancel}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel order"}
      </Button>
    );
  }

  if (!isConfirming) {
    return (
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 rounded-full"
          onClick={() => setIsConfirming(true)}
        >
          Confirm
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-12 rounded-full text-muted-foreground"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`name-${order.id}`}>Name</Label>
        <Input
          id={`name-${order.id}`}
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`email-${order.id}`}>Email</Label>
        <Input
          id={`email-${order.id}`}
          type="email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`address-${order.id}`}>Shipping address</Label>
        <Input
          id={`address-${order.id}`}
          value={form.shippingAddress}
          onChange={(e) =>
            setForm({ ...form, shippingAddress: e.target.value })
          }
        />
      </div>
      <Button
        className="w-full h-12 rounded-full"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Place order"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Tulis halaman orders**

Buat `artifacts/swipe-fashion-next/app/orders/page.tsx`. Struktur kartu, badge status, dan keadaan kosong mengikuti halaman lama yang dibaca di Step 1:

```tsx
import type { Metadata } from "next";

import { AppLayout } from "@/components/layout";
import { OrderActions } from "@/components/order-actions";
import { listOrders } from "@/lib/data";
import { getSessionId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your Bag | SwipeFash",
  // Halaman personal — tidak ada gunanya di hasil pencarian.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const statusClass: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-green-500/10 text-green-500",
  shipped: "bg-blue-500/10 text-blue-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function OrdersPage() {
  const sessionId = await getSessionId();
  const orders = sessionId ? await listOrders(sessionId) : [];

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6">
          <h1 className="font-serif text-4xl">Your Bag</h1>
        </header>

        {orders.length === 0 ? (
          <div className="text-center py-20 px-8 text-muted-foreground">
            <p className="font-serif text-2xl mb-2 text-foreground">
              Nothing here yet.
            </p>
            <p className="text-sm">
              Swipe right on something you like to add it to your bag.
            </p>
          </div>
        ) : (
          <div className="px-4 pb-8 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card border border-card-border rounded-2xl p-4 space-y-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.product?.imageUrl ?? ""}
                    alt={order.product?.name ?? "Product"}
                    className="w-20 h-24 object-cover rounded-md bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                      {order.product?.brand}
                    </p>
                    <h3 className="font-serif text-lg leading-snug mb-1 truncate">
                      {order.product?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Size {order.selectedSize} · {order.selectedColor} ·{" "}
                      {order.quantity}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-lg">
                        ${order.totalPrice.toFixed(2)}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${
                          statusClass[order.status] ?? statusClass.pending
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <OrderActions order={order} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 4: Verifikasi alur lengkap**

Run: `cd artifacts/swipe-fashion-next && pnpm run dev`

Di satu browser, kerjakan berurutan:
1. Buka `/`, geser kanan sebuah produk, selesaikan drawer order
2. Buka `/orders` → order tampil dengan status `pending`
3. Klik Confirm, isi nama, email, alamat, klik Place order → status berubah jadi `confirmed` tanpa reload manual
4. Klik Cancel order → status berubah jadi `cancelled`

- [ ] **Step 5: Verifikasi stok benar-benar dikembalikan**

Ini yang rusak di backend lama.

Run: `psql "$DIRECT_URL" -c "SELECT id, stock FROM products WHERE id = 1;"`

Expected: stok kembali ke nilai sebelum order dibuat. Bila tidak, cek apakah pemakaian `sql` di `cancelOrderAction` sudah benar.

- [ ] **Step 6: Verifikasi isolasi sesi**

Buka `/orders` di jendela penyamaran. Expected: keadaan kosong, tidak ada order milik sesi lain yang bocor.

- [ ] **Step 7: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "feat(next): port orders page onto server components"
```

---

### Task 15: Verifikasi menyeluruh berdampingan

**Interfaces:**
- Tidak ada kode baru. Task ini adalah gerbang sebelum deploy.

**Konteks:** Sampai titik ini setiap halaman sudah diverifikasi sendiri-sendiri. Task ini memeriksa keseluruhannya sekaligus, selagi aplikasi lama masih ada untuk dibandingkan. Ini kesempatan terakhir membandingkan sebelum Task 17 menghapusnya.

> Catatan: Next butuh proses Node yang hidup (bukan static). Konfigurasi runtime deploy diatur di platform hosting (Vercel), bukan file config di dalam repo.

- [ ] **Step 2: Typecheck dan test seluruh workspace**

```bash
pnpm run typecheck
cd artifacts/swipe-fashion-next && pnpm run test && pnpm run build
```

Expected: ketiganya bersih. Nol error TypeScript, 6 unit test lulus, build sukses.

- [ ] **Step 3: Perbandingan visual layar per layar**

Jalankan keduanya berdampingan pada viewport 390px dan bandingkan tiap layar:

| Layar | Yang diperiksa |
|---|---|
| `/welcome` | Gambar hero, pemenggalan baris judul, jarak antar bagian, gaya tombol |
| `/` | Tinggi kartu, radius, gradien, posisi badge, tombol aksi, rotasi saat geser |
| `/lookbook` | Grid dua kolom, rasio gambar, gaya tab, badge New |
| `/lookbook` tiap kategori | Isi hasil filter cocok |
| `/product/1` | Tinggi gambar, gradien, kartu yang menumpuk naik, bar bawah |
| Drawer order | Tombol ukuran, lingkaran warna, cincin saat terpilih, tombol |
| `/orders` kosong | Teks keadaan kosong |
| `/orders` berisi | Tata letak kartu, warna badge status |
| 404 | Sengaja berbeda — versi baru bertema gelap |

Catat setiap perbedaan. Perbedaan yang bukan disengaja harus diperbaiki sebelum lanjut.

- [ ] **Step 4: Verifikasi SEO yang jadi tujuan utama**

```bash
cd artifacts/swipe-fashion-next && pnpm run build && pnpm run start
curl -s http://localhost:20100/product/2 | grep -o '<title>[^<]*</title>'
curl -s http://localhost:20100/product/2 | grep 'og:image'
curl -s http://localhost:20100/orders | grep 'noindex'
```

Expected: title berisi nama dan brand produk, ada `og:image`, dan halaman orders membawa `noindex`.

- [ ] **Step 5: Commit**

```bash
git add artifacts/swipe-fashion-next
git commit -m "chore(next): verify full workspace before deploy"
```

---

### Task 16: Deploy ke Vercel

**Files:**
- Create: `artifacts/swipe-fashion-next/vercel.json`

**Interfaces:**
- Produces: aplikasi yang hidup di URL Vercel.

**Konteks:** Ini monorepo pnpm, jadi Vercel perlu diberi tahu bahwa root project ada di subfolder tapi install harus dijalankan dari root workspace.

- [ ] **Step 1: Buat konfigurasi Vercel**

Buat `artifacts/swipe-fashion-next/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm --filter @workspace/swipe-fashion-next run build",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

- [ ] **Step 2: Minta user menyiapkan project Vercel**

Butuh tindakan manual user:
1. Import repository di https://vercel.com/new
2. Set **Root Directory** ke `artifacts/swipe-fashion-next`
3. Di Settings → Environment Variables, tambahkan `DATABASE_URL` berisi connection string **pooler** Supabase (port 6543) untuk Production, Preview, dan Development

Repository harus sudah ada di GitHub. Bila belum, itu perlu dikerjakan lebih dulu.

- [ ] **Step 3: Deploy dan verifikasi**

Setelah deploy selesai, jalankan pada URL produksi:

```bash
curl -s https://<domain>/product/1 | grep -o '<title>[^<]*</title>'
curl -si https://<domain>/ | grep -i "set-cookie"
```

Expected: title berisi nama produk, dan cookie sesi ditetapkan dengan flag `Secure` karena produksi memakai HTTPS.

- [ ] **Step 4: Verifikasi alur di produksi**

Di URL produksi, jalankan alur lengkap: geser kanan, buat order, buka `/orders`, konfirmasi, batalkan. Ini memastikan pooler Supabase menangani koneksi serverless dengan benar.

- [ ] **Step 5: Commit**

```bash
git add artifacts/swipe-fashion-next/vercel.json
git commit -m "chore(next): add Vercel monorepo build config"
```

---

### Task 17: Hapus aplikasi dan paket lama

**Files:**
- Delete: `artifacts/swipe-fashion/`
- Delete: `artifacts/api-server/`
- Delete: `lib/api-spec/`
- Delete: `lib/api-zod/`
- Delete: `lib/api-client-react/`
- Modify: `package.json` root, `PROJECT.md`

**Interfaces:**
- Produces: workspace yang hanya berisi aplikasi Next, `lib/db`, dan `scripts`.

**Konteks:** Jalankan task ini **hanya setelah** Task 16 berhasil dan user mengonfirmasi aplikasi produksi berjalan benar. Semuanya bisa dipulihkan dari commit `9b3b831` bila ternyata ada yang terlewat.

- [ ] **Step 1: Minta konfirmasi user**

Jangan hapus apa pun sebelum user secara eksplisit mengonfirmasi bahwa deployment Vercel berjalan benar. Ini satu-satunya langkah yang sulit dibatalkan dalam plan ini.

- [ ] **Step 2: Pastikan tidak ada yang masih merujuk paket lama**

Run: `grep -rn "api-client-react\|api-zod\|@workspace/swipe-fashion\"" --include="*.ts" --include="*.tsx" --include="*.json" artifacts/swipe-fashion-next lib scripts`

Expected: nol hasil. Bila ada, itu harus diselesaikan lebih dulu.

- [ ] **Step 3: Hapus**

```bash
git rm -r artifacts/swipe-fashion artifacts/api-server lib/api-spec lib/api-zod lib/api-client-react
```

- [ ] **Step 4: Bersihkan typecheck root**

`package.json` root punya script `typecheck:libs` yang memakai `tsc --build` dengan referensi project. Periksa `tsconfig.json` root dan hapus referensi ke paket yang sudah tidak ada.

Run: `cat tsconfig.json`

Hapus entri `references` yang menunjuk `lib/api-spec`, `lib/api-zod`, atau `lib/api-client-react`.

- [ ] **Step 5: Perbarui PROJECT.md**

File ini masih berisi template kosong dari scaffold. Isi bagian **Run & Operate**, **Stack**, dan **Where things live** supaya mencerminkan keadaan sebenarnya: satu aplikasi Next.js, Supabase, deploy di Vercel. Hapus baris `pnpm --filter @workspace/api-server run dev` yang sudah tidak berlaku.

- [ ] **Step 6: Verifikasi workspace masih sehat**

```bash
pnpm install
pnpm run typecheck
cd artifacts/swipe-fashion-next && pnpm run test && pnpm run build
```

Expected: semuanya bersih.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove Vite app, Express API, and generated API client

Digantikan artifacts/swipe-fashion-next. Baseline sebelum migrasi
tetap ada di commit 9b3b831 bila sewaktu-waktu perlu dirujuk."
```

---

## Ringkasan urutan

| Task | Hasil | Bisa diverifikasi lewat |
|---|---|---|
| 1 | Supabase tersambung | `psql \dt` |
| 2 | 4 kategori, 12 produk | query group by |
| 3 | App Next hidup, token dan font aktif | perbandingan visual |
| 4 | Aset dan 10 file shadcn | typecheck |
| 5 | format dan validation | 6 unit test |
| 6 | Lapisan baca data | JSON di browser |
| 7 | Layout, nav, 404 | perbandingan visual |
| 8 | `/welcome` | perbandingan visual |
| 9 | `/lookbook` | curl + filter |
| 10 | `/product/[id]` + SEO | curl title dan og |
| 11 | Cookie sesi, Server Actions | curl set-cookie |
| 12 | Drawer order | order tersimpan di DB |
| 13 | `/` feed swipe | curl + uji gestur |
| 14 | `/orders` | alur lengkap |
| 15 | Gerbang verifikasi | perbandingan menyeluruh |
| 16 | Live di Vercel | curl produksi |
| 17 | Yang lama dihapus | typecheck bersih |
