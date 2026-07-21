# Migrasi SwipeFash ke Next.js

**Tanggal:** 2026-07-21
**Status:** Disetujui, siap masuk tahap implementation plan

## Ringkasan

Memindahkan `artifacts/swipe-fashion` dari Vite SPA + Express API terpisah menjadi satu
aplikasi Next.js App Router yang di-deploy ke Vercel dengan database Supabase. Tampilan
aplikasi tidak berubah.

## Tujuan

1. **SEO / SSR** — halaman produk ter-render di server dan bisa di-index mesin pencari.
2. **Backend menyatu** — Express API pindah ke Server Components dan Server Actions.
3. **Deploy ke Vercel** — lepas dari static hosting Replit.
4. **Design tetap sama** — token warna, tipografi, spasi, dan animasi dipertahankan.

## Kondisi awal

`artifacts/swipe-fashion` — Vite SPA:

- 6 rute lewat wouter: `/welcome`, `/`, `/orders`, `/lookbook`, `/product/:id`, 404
- 3 komponen aplikasi: `layout`, `product-card`, `order-sheet`
- 55 komponen shadcn/ui hasil scaffold, **9 di antaranya benar-benar dipakai**:
  badge, button, card, drawer, input, label, skeleton, toaster, tooltip.
  Ditambah `toast` sebagai dependensi `toaster`, totalnya 10 file yang perlu dibawa.
- 3 hook: `use-toast` (dibawa), `use-session` (digantikan cookie), `use-mobile`
  (hanya dipakai `sidebar` yang tidak terpakai — tidak dibawa)
- TanStack Query + klien hasil generate Orval (`@workspace/api-client-react`)
- Tailwind 4 lewat plugin Vite; `src/index.css` 137 baris memegang seluruh design token
- Deploy Replit sebagai static dengan SPA rewrite

`artifacts/api-server` — Express 5, 543 baris, 4 file rute (products, orders, categories,
health). Mengakses Postgres lewat Drizzle di `lib/db`.

## Kendala yang ditemukan

| Kendala | Lokasi | Penanganan |
|---|---|---|
| Gambar produk di-serve dari filesystem | `artifacts/api-server/src/app.ts:38` | 16 file / 2,9 MB dipindah ke `public/assets/` |
| `pg.Pool` tidak aman di serverless | `lib/db/src/index.ts:13` | Pakai connection string pooler Supabase + `max: 1` |
| Session ID di localStorage, server tidak bisa membacanya | `src/hooks/use-session.ts` | Ganti jadi cookie httpOnly |
| Repo belum di bawah version control | root | `git init` + commit awal sebelum implementasi |

## Arsitektur tujuan

```
artifacts/swipe-fashion-next/
├── app/
│   ├── layout.tsx              # next/font, globals.css, TooltipProvider, Toaster
│   ├── page.tsx                # feed: data awal dari server, swipe di client
│   ├── welcome/page.tsx        # landing, statis penuh
│   ├── lookbook/page.tsx       # server, filter lewat searchParams
│   ├── product/[id]/page.tsx   # server + generateMetadata
│   ├── orders/page.tsx         # server, baca cookie sesi
│   ├── actions.ts              # Server Actions
│   └── not-found.tsx
├── components/
│   ├── layout.tsx
│   ├── product-card.tsx        # 'use client' — drag framer-motion
│   ├── order-sheet.tsx         # 'use client'
│   └── ui/                     # 10 file shadcn saja, bukan 55
├── lib/utils.ts
├── middleware.ts               # set cookie sesi bila belum ada
├── public/assets/
├── globals.css
└── next.config.ts
```

Aplikasi baru dibuat **berdampingan**. `artifacts/swipe-fashion` dan `artifacts/api-server`
tetap utuh sampai aplikasi baru terbukti setara, baru dihapus.

### Paket yang dipakai ulang

- `lib/db` — schema Drizzle, tanpa perubahan schema
- `lib/api-zod` — dipakai memvalidasi input Server Actions

### Paket yang dihapus di akhir

`artifacts/api-server`, `artifacts/swipe-fashion`, `lib/api-spec`, `lib/api-client-react`

## Menjaga design

Bagian ini menentukan apakah migrasi dianggap berhasil.

- `src/index.css` disalin menjadi `globals.css` **verbatim** — seluruh variabel HSL,
  `--radius`, blok `@layer base`, dan util `.no-scrollbar` tidak diubah.
- 10 file shadcn disalin apa adanya, hanya ditambah direktif `'use client'`.
- Baris `@import` Google Fonts diganti `next/font/google` untuk Playfair Display dan DM Sans.
  Nama variabel CSS tetap `--app-font-serif` dan `--app-font-sans`, sehingga tidak ada satu pun
  kelas `font-serif` di JSX yang perlu disentuh. Font jadi self-hosted: tidak ada layout shift.
- `index.html` memuat font Inter yang tidak pernah dirujuk CSS mana pun. Tidak dibawa.
- Tailwind 4 beralih dari plugin Vite ke `@tailwindcss/postcss`.
- framer-motion dipertahankan; animasi swipe tidak diubah.

## Routing

| Vite + wouter | Next App Router |
|---|---|
| `<Route path="/welcome">` | `app/welcome/page.tsx` |
| `<Route path="/product/:id">` | `app/product/[id]/page.tsx` |
| `useParams()` | prop `params` |
| `useLocation()` di `BottomNav` | `usePathname()` |
| `<Link>` wouter | `next/link` |
| `<Route component={NotFound}>` | `app/not-found.tsx` |

## Lapisan data

Server Component meng-query Drizzle langsung, tanpa perantara HTTP.

**Per halaman:**

- `/welcome` — statis, tanpa akses data.
- `/product/[id]` — Server Component. `generateMetadata` mengisi title, description, dan
  OG image dari foto produk. Ini sumber utama nilai SEO-nya.
- `/lookbook` — Server Component. Filter kategori pindah dari state React ke `?category=<slug>`
  di URL, tombol filter menjadi `<Link>`. Hasilnya bisa dibagikan dan bisa di-index.
- `/` (feed) — Server Component mengambil 10 produk pertama lalu mengoper ke client component.
  Interaksi drag tetap sepenuhnya di client.
- `/orders` — Server Component membaca cookie sesi. Ditandai `noindex`.

**Mutasi** menjadi Server Actions di `app/actions.ts`: `createOrder`, `confirmOrder`,
`cancelOrder`. Input divalidasi dengan skema dari `@workspace/api-zod`, lalu
`revalidatePath('/orders')`.

**Sesi:** `middleware.ts` menetapkan cookie httpOnly `swipefash_session` berisi UUID bila
belum ada. Menggantikan `useSession`. Dari sisi pengguna perilakunya sama.

## Gambar

`attached_assets/` (16 file, 2,9 MB) disalin ke `public/assets/`. Kolom `imageUrl` di database
berisi path berawalan `/api/assets/`, jadi `next.config.ts` memasang rewrite dari
`/api/assets/:path*` ke `/assets/:path*` — data tidak perlu diubah.

`<img>` diganti `next/image` di grid lookbook dan halaman produk, memakai `fill` +
`object-cover` agar ukuran dan crop-nya identik.

## Database

Supabase Postgres. `lib/db/src/index.ts` tetap memakai driver `node-postgres`, tetapi diarahkan
ke connection string **pooler** Supabase (port 6543, transaction mode) dengan `max: 1` supaya
aman di lingkungan serverless. Schema Drizzle tidak berubah.

Data lama tidak dipindahkan — isinya data dummy. Dibuat script seed yang mengisi tabel
`categories` dan `products` merujuk 16 gambar di `public/assets/`.

## Deployment

- Vercel dengan root directory `artifacts/swipe-fashion-next`, install command sadar pnpm workspace.
- Environment variable: `DATABASE_URL` mengarah ke pooler Supabase.
- `.replit-artifact/artifact.toml` aplikasi baru menjalankan `next dev`, agar pengembangan di
  Replit tetap bisa dilakukan.

## Verifikasi

Repo tidak punya test sama sekali, jadi verifikasi bersandar pada:

1. `pnpm typecheck` dan `next build` bersih tanpa error.
2. Kedua aplikasi dijalankan berdampingan, dibandingkan layar per layar pada viewport mobile:
   landing, feed, lookbook (termasuk tiap filter kategori), halaman produk, orders.
3. Alur end-to-end dijalankan manual: swipe kanan, buat order, konfirmasi, batalkan.
4. Cek `curl` pada `/product/1` memastikan HTML produk benar-benar ter-render di server.

## Risiko

- **"Mirip" itu subjektif.** Tanpa screenshot pembanding, perbedaan halus bisa lolos.
  Mitigasinya: aplikasi lama sengaja dipertahankan agar bisa dibandingkan langsung.
- **`next/image` mengubah markup gambar.** Paling berisiko di `product-card` yang di-drag.
  Bila ada perbedaan tampilan, kartu swipe boleh tetap memakai `<img>` biasa.
- **Server Actions mengubah penanganan error.** Pola `toast` pada kegagalan mutasi perlu
  disusun ulang; pesan error yang dilihat pengguna harus tetap sama.

## Urutan pengerjaan

1. `git init` dan commit awal
2. Siapkan project Supabase, arahkan `lib/db`, jalankan push schema dan seed
3. Scaffold `swipe-fashion-next`: config, globals.css, font, 10 file shadcn
4. Layout dan navigasi
5. Halaman statis dan konten: welcome, lookbook, product
6. Feed dan swipe di client
7. Cookie sesi, Server Actions, halaman orders
8. Verifikasi berdampingan
9. Deploy ke Vercel
10. Hapus paket lama
