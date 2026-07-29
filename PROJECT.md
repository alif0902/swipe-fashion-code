# SwipeFash

Aplikasi belanja fashion mobile-first: pengguna men-*swipe* katalog produk seperti aplikasi kencan — geser kanan untuk suka, geser kiri untuk lewat — lalu memesan langsung dari kartu yang cocok.

## Run & Operate

Semua perintah dijalankan dari root repo.

```bash
npm install
npm run rebuild:native   # WAJIB setelah install — lihat "Keamanan install" di bawah
npm run dev
```

- `npm run dev` — jalankan aplikasi (port 20100, atau `PORT`)
- `npm run build` — typecheck + production build Next.js
- `npm start` — jalankan hasil build
- `npm test` — unit test Vitest (`lib/format.ts`, `lib/validation.ts`)
- `npm run typecheck` — typecheck seluruh workspace
- `npm run db:push` — push perubahan schema DB (dev only)
- `npm run seed` — isi tabel categories dan products
- `npm run set-images` — pasang path gambar ke produk
- `npm run verify-stock` — cek regresi pemulihan stok
- `npm run rebuild:native` — build ulang esbuild dan sharp

Env wajib (di `artifacts/swipe-fashion-next/.env.local`, contoh ada di `.env.local.example`):

- `DATABASE_URL` — Supabase **transaction pooler** (port 6543), dipakai saat runtime
- `DIRECT_URL` — Supabase **direct/session** (port 5432), dipakai `drizzle-kit push` dan seed

## Keamanan install

Repo ini pindah dari pnpm ke npm. pnpm punya beberapa pengaman yang **npm tidak
punya padanannya**, jadi ada yang hilang dan ada yang diganti manual. Ini dicatat
supaya tidak diam-diam terlupakan.

| Pengaman pnpm | Status di npm | Pengganti |
|---|---|---|
| `onlyBuiltDependencies` — allowlist paket yang boleh menjalankan install script | Diganti | `ignore-scripts=true` di `.npmrc` mematikan **semua** install script. Paket yang benar-benar butuh build native dijalankan eksplisit lewat `npm run rebuild:native`. Script itulah allowlist-nya sekarang. |
| `minimumReleaseAge: 1440` — tolak paket yang rilis <1 hari | **Hilang** | Tidak ada padanan di npm. Rilis npm berbahaya biasanya ketahuan dan ditarik dalam hitungan jam, jadi pertahanan ini nyata nilainya. Gantinya hanya kehati-hatian manual: jangan `npm update` sembarangan, dan periksa changelog sebelum menaikkan versi. |
| `overrides: "paket>binary-platform-lain": "-"` — buang binary platform yang tidak dipakai | **Hilang** | npm tidak bisa menghapus optional dependency. Akibatnya `node_modules` lebih besar karena binary esbuild/rollup/lightningcss untuk semua platform ikut terpasang. Fungsional, hanya boros. |
| `catalog:` — satu sumber versi untuk seluruh workspace | **Hilang** | Versi kini ditulis literal di tiap `package.json`. Kalau menaikkan versi paket yang dipakai lebih dari satu workspace (`drizzle-orm`, `zod`, `@types/node`), **naikkan di semua tempat** agar tidak terpasang dua versi berbeda. |

Yang dipertahankan: pin `esbuild: "0.27.3"` lewat `overrides` di `package.json`
root, karena drizzle-kit menarik esbuild versi lama yang rentan.

## Stack

- npm workspaces, Node.js 22+, TypeScript 5.9
- Next.js 16 App Router + React 19, Server Components & Server Actions
- Tailwind CSS 4, shadcn/ui, framer-motion, lucide-react
- PostgreSQL (Supabase) + Drizzle ORM
- Validasi: Zod
- Test: Vitest (hanya modul murni)
- Deploy target: Vercel

## Where things live

| Path | Isi |
|---|---|
| `artifacts/swipe-fashion-next/` | Satu-satunya aplikasi. Semua rute, komponen, dan data layer. |
| `artifacts/swipe-fashion-next/app/` | Rute App Router: `/welcome`, `/landing`, `/feed`, `/lookbook`, `/obsessed`, `/orders`, `/product/[id]` |
| `artifacts/swipe-fashion-next/app/actions.ts` | Server Actions: `createOrderAction`, `superLikeAction`, `confirmOrderAction`, `cancelOrderAction` |
| `artifacts/swipe-fashion-next/lib/data.ts` | **Sumber kebenaran query baca** untuk Server Component |
| `artifacts/swipe-fashion-next/lib/taste.ts` | **Mesin selera.** Bangun profil dari swipe, skor & urutkan produk. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/outfit.ts` | **Perakit outfit** "Complete the Look". Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/format.ts` | Konversi row DB → tipe aplikasi. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/validation.ts` | Skema Zod input Server Action. Murni, diuji unit |
| `artifacts/swipe-fashion-next/app/globals.css` | **Sumber kebenaran design token** (warna HSL, radius, font) |
| `artifacts/swipe-fashion-next/middleware.ts` | Set cookie sesi httpOnly bila belum ada |
| `lib/db/src/schema/` | **Sumber kebenaran schema DB**: categories, products, orders, super-likes, swipes |
| `scripts/src/` | Seed, set gambar produk, verifikasi stok |
| `docs/design-reference/` | Screenshot referensi visual (with.is) yang jadi acuan tema coral |

## Architecture decisions

- **Tidak ada lapisan HTTP internal.** Server Component meng-query Drizzle langsung; mutasi lewat Server Actions. Express API server, OpenAPI spec, dan client hasil Orval sudah dihapus karena tak ada yang memakainya.
- **Logika personalisasi hidup di modul murni, bukan di query.** `lib/taste.ts` dan `lib/outfit.ts` tidak menyentuh DB sama sekali — `lib/data.ts` yang mengambil baris, modul murni yang memutuskan urutan dan padanan. Itulah sebabnya keduanya bisa diuji unit tanpa harness database, dan mengapa `listProducts` tidak lagi menyimpan aturan skor sendiri.
- **Swipe kiri direkam, bukan dibuang.** Tabel `swipes` menyimpan `pass` / `like` / `super` dengan unique per sesi-produk. Tanpa sinyal negatif, profil hanya tahu apa yang disukai dan tak pernah belajar apa yang dihindari. Ini juga yang membuat produk yang sudah ditolak tidak muncul lagi di feed.
- **Perekaman swipe sengaja fire-and-forget.** Animasi kartu tidak boleh menunggu jaringan; kalau satu request gagal, yang hilang cuma satu sinyal.
- **Sesi = cookie httpOnly, bukan localStorage.** Server harus bisa membaca identitas sesi untuk memfilter order dan super-like, jadi `middleware.ts` yang menerbitkannya, bukan kode klien.
- **Dua connection string Supabase.** Runtime memakai transaction pooler (6543) dengan `max: 1` karena tiap instance Vercel punya pool sendiri; DDL memakai direct (5432) karena pooler tidak mendukung DDL.
- **Vitest hanya untuk modul murni.** Tidak ada harness test DB. Halaman dan Server Action diverifikasi lewat `next build`, `tsc --noEmit`, dan pemeriksaan manual.
- **Nama variabel CSS `--app-font-sans` / `--app-font-serif` / `--app-font-mono` tidak boleh berubah** — seluruh JSX bergantung pada kelas `font-serif` / `font-sans` yang di-map ke sana.

## Product

- **Welcome / Landing** — halaman masuk bertema.
- **Feed** — tumpukan kartu produk yang bisa di-swipe; like memunculkan match overlay, super-like menyimpan ke koleksi Obsessed. Urutan feed ditentukan mesin selera.
- **Style DNA** — visualisasi apa yang dipelajari aplikasi dari swipe-mu: kategori yang dicari dan dihindari, label, palet warna, rentang harga, dan tingkat keyakinan. Punya gambar OG untuk di-share.
- **Complete the Look** — outfit yang dirakit otomatis dari koleksi Obsessed (atasan + bawahan, atau dress, ditumpuk luaran).
- **Lookbook** — grid katalog dengan filter kategori lewat query string URL.
- **Product detail** — halaman produk dengan metadata SEO dan tag OpenGraph yang ter-render di server.
- **Obsessed** — koleksi produk yang di-super-like pada sesi ini.
- **Orders** — buat, konfirmasi, dan batalkan pesanan. Membatalkan mengembalikan stok.

## User preferences

- Bahasa komentar kode dan dokumen: Indonesia.
- Package manager: **npm** (pindah dari pnpm atas permintaan user).
- Versi React dipatok **tepat 19.1.0**. Jangan diubah.
- `ignore-scripts=true` di `.npmrc` **jangan dimatikan** — lihat "Keamanan install".

## Gotchas

- **Tabel `swipes` wajib di-push sebelum personalisasi hidup.** Jalankan `npm run db:push`. Tanpa itu aplikasi tetap jalan (semua query dibungkus try/catch), tapi feed kembali ke urutan id dan Style DNA kosong.
- **`npm install` saja tidak cukup.** Karena install script dimatikan, esbuild dan sharp belum ter-build. Selalu lanjutkan dengan `npm run rebuild:native`, jika tidak Vitest dan optimisasi gambar `next/image` akan gagal.
- Versi dependency ditulis literal, tidak ada `catalog:` lagi. Paket yang dipakai lintas workspace (`drizzle-orm`, `zod`, `@types/node`) harus dinaikkan serempak.
- `drizzle-kit push` akan gagal lewat pooler 6543 — pastikan `DIRECT_URL` terisi.
- `.env.local` berisi kredensial asli dan di-gitignore. Jangan pernah di-commit.
- Ada dua halaman masuk yang tumpang tindih (`/welcome` dan `/landing`); `/` redirect ke `/welcome`. Salah satu perlu dipilih.

## Pointers

- Struktur workspace didefinisikan di field `workspaces` pada `package.json` root: `artifacts/*`, `lib/*`, `scripts`.
