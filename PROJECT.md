# SwipeFash

Aplikasi belanja fashion mobile-first: pengguna men-*swipe* katalog produk seperti aplikasi kencan — geser kanan untuk suka, geser kiri untuk lewat — lalu memesan langsung dari kartu yang cocok.

## Run & Operate

- `pnpm --filter @workspace/swipe-fashion-next run dev` — jalankan aplikasi (port 20100, atau `PORT`)
- `pnpm --filter @workspace/swipe-fashion-next run build` — production build Next.js
- `pnpm --filter @workspace/swipe-fashion-next run test` — unit test Vitest (`lib/format.ts`, `lib/validation.ts`)
- `pnpm run typecheck` — typecheck seluruh workspace
- `pnpm run build` — typecheck + build semua paket
- `pnpm --filter @workspace/db run push` — push perubahan schema DB (dev only)
- `pnpm --filter @workspace/scripts run seed` — isi tabel categories dan products
- `pnpm --filter @workspace/scripts run set-images` — pasang path gambar ke produk
- `pnpm --filter @workspace/scripts run verify-stock` — cek regresi pemulihan stok

Env wajib (di `artifacts/swipe-fashion-next/.env.local`, contoh ada di `.env.local.example`):

- `DATABASE_URL` — Supabase **transaction pooler** (port 6543), dipakai saat runtime
- `DIRECT_URL` — Supabase **direct/session** (port 5432), dipakai `drizzle-kit push` dan seed

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
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
| `artifacts/swipe-fashion-next/lib/format.ts` | Konversi row DB → tipe aplikasi. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/validation.ts` | Skema Zod input Server Action. Murni, diuji unit |
| `artifacts/swipe-fashion-next/app/globals.css` | **Sumber kebenaran design token** (warna HSL, radius, font) |
| `artifacts/swipe-fashion-next/middleware.ts` | Set cookie sesi httpOnly bila belum ada |
| `lib/db/src/schema/` | **Sumber kebenaran schema DB**: categories, products, orders, super-likes |
| `scripts/src/` | Seed, set gambar produk, verifikasi stok |
| `docs/superpowers/` | Spec dan plan migrasi Next.js |

## Architecture decisions

- **Tidak ada lapisan HTTP internal.** Server Component meng-query Drizzle langsung; mutasi lewat Server Actions. Express API server, OpenAPI spec, dan client hasil Orval sudah dihapus karena tak ada yang memakainya.
- **Sesi = cookie httpOnly, bukan localStorage.** Server harus bisa membaca identitas sesi untuk memfilter order dan super-like, jadi `middleware.ts` yang menerbitkannya, bukan kode klien.
- **Dua connection string Supabase.** Runtime memakai transaction pooler (6543) dengan `max: 1` karena tiap instance Vercel punya pool sendiri; DDL memakai direct (5432) karena pooler tidak mendukung DDL.
- **Vitest hanya untuk modul murni.** Tidak ada harness test DB. Halaman dan Server Action diverifikasi lewat `next build`, `tsc --noEmit`, dan pemeriksaan manual.
- **Nama variabel CSS `--app-font-sans` / `--app-font-serif` / `--app-font-mono` tidak boleh berubah** — seluruh JSX bergantung pada kelas `font-serif` / `font-sans` yang di-map ke sana.

## Product

- **Welcome / Landing** — halaman masuk bertema.
- **Feed** — tumpukan kartu produk yang bisa di-swipe; like memunculkan match overlay, super-like menyimpan ke koleksi Obsessed.
- **Lookbook** — grid katalog dengan filter kategori lewat query string URL.
- **Product detail** — halaman produk dengan metadata SEO dan tag OpenGraph yang ter-render di server.
- **Obsessed** — koleksi produk yang di-super-like pada sesi ini.
- **Orders** — buat, konfirmasi, dan batalkan pesanan. Membatalkan mengembalikan stok.

## User preferences

- Bahasa komentar kode dan dokumen: Indonesia.
- Package manager **wajib pnpm**; `npm install` diblokir guard di `package.json` root.
- Versi React dipatok **tepat 19.1.0** di catalog. Jangan diubah.
- `minimumReleaseAge: 1440` di `pnpm-workspace.yaml` **jangan dinonaktifkan** — ini pertahanan supply-chain.

## Gotchas

- Dependency baru pakai `catalog:` bila namanya sudah ada di catalog root `pnpm-workspace.yaml`.
- `drizzle-kit push` akan gagal lewat pooler 6543 — pastikan `DIRECT_URL` terisi.
- `.env.local` berisi kredensial asli dan di-gitignore. Jangan pernah di-commit.
- Ada dua halaman masuk yang tumpang tindih (`/welcome` dan `/landing`); `/` redirect ke `/welcome`. Salah satu perlu dipilih.

## Pointers

- Lihat skill `pnpm-workspace` untuk struktur workspace, setup TypeScript, dan detail paket.
