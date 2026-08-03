# HITOME

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
- `npm run sync-products` — selaraskan produk yang sudah ada (harga, deskripsi, foto, material, dimensi, gender) dengan katalog
- `npm run dedupe-products` — hapus produk duplikat bernama sama, hanya yang belum dirujuk pesanan/swipe
- `npm run verify-stock` — cek regresi pemulihan stok
- `npm run rebuild:native` — build ulang esbuild dan sharp

Env wajib (di `artifacts/swipe-fashion-next/.env.local`, contoh ada di `.env.local.example`):

- `DATABASE_URL` — Supabase **transaction pooler** (port 6543), dipakai saat runtime
- `DIRECT_URL` — Supabase **direct/session** (port 5432), dipakai `drizzle-kit push` dan seed

## Deploy ke Vercel

Konfigurasi dipin di `vercel.json` di root repo, jadi tidak ada yang perlu
ditebak lewat dashboard selain env var.

**Root Directory di Vercel = `artifacts/swipe-fashion-next`.** Vercel
menyetelnya otomatis saat import, dan itu memang jalur yang direkomendasikan
untuk monorepo. Konsekuensinya semua perintah berjalan dengan cwd di folder
aplikasi, bukan root repo.

Perintahnya sengaja dibuat **bekerja dari kedua lokasi**, bukan diikat ke salah
satu. Alasannya praktis: override di Project Settings dashboard dan isi
`vercel.json` bisa berbeda, dan menebak mana yang menang adalah sumber
kegagalan deploy yang sulit dilacak. Jadi:

- `rebuild:native` ada di **dua** `package.json`. Versi root menjalankan
  `npm rebuild esbuild sharp`; versi aplikasi menjalankan hal yang sama setelah
  `cd ../..`. Perintah `npm run rebuild:native` karena itu selalu berhasil.
- `npm run build` juga bermakna di kedua tempat — di root berarti typecheck
  seluruh workspace lalu build aplikasi, di folder aplikasi berarti
  `next build`.
- `outputDirectory` tidak diset — bawaannya `.next` relatif terhadap Root
  Directory, dan itu sudah benar.

`vercel.json` sendiri tetap dibaca dari root repo apa pun Root Directory-nya.

Langkah sekali jalan:

1. vercel.com → **Add New → Project** → import repo GitHub-nya.
2. Pastikan **Root Directory** = `artifacts/swipe-fashion-next`.
3. Framework, install, dan build command sudah terbaca dari `vercel.json` —
   biarkan apa adanya.
4. **Environment Variables** — tambahkan sebelum deploy pertama:

   | Nama | Nilai | Catatan |
   |---|---|---|
   | `DATABASE_URL` | Connection string **Transaction pooler** Supabase (port 6543) | Satu-satunya yang dibutuhkan Vercel |

   `DIRECT_URL` **tidak perlu** diset di Vercel. Itu hanya dipakai
   `drizzle-kit push` dan seed dari mesin lokal.

5. Deploy.

Sesudah deploy pertama, tiap push ke `main` auto-deploy dan tiap PR dapat
preview URL.

**PENTING untuk kecepatan: Settings → Functions → set region ke Sydney (syd1).**

Database Supabase ada di `ap-southeast-2` (Sydney). Region bawaan Vercel adalah
`iad1` (Washington DC), jadi tanpa perubahan ini **setiap query menyeberang
Pasifik** — sekitar 200–250 ms sekali jalan. Satu halaman yang melakukan dua
query berarti hampir setengah detik hanya menunggu jaringan, sebelum satu piksel
pun digambar. Menyamakan region memangkasnya ke satuan milidetik.

Sengaja tidak dipin di `vercel.json` supaya tidak berisiko ditolak di plan
Hobby; setel lewat dashboard.

### Jebakan yang sudah diketahui

- **Build gagal dengan "DATABASE_URL must be set"** — env var belum diset.
  Next mengimpor modul rute saat build, dan `lib/db` melempar error saat
  di-import. Koneksi sungguhan tidak dibutuhkan saat build, cukup string-nya ada.
- **`npm ci` gagal** — `package-lock.json` tidak sinkron dengan `package.json`.
  Jalankan `npm install` lokal, commit lockfile-nya.
- **`Missing script: "rebuild:native"`** — skrip itu hilang dari salah satu dari
  dua `package.json` yang harus memilikinya (root dan aplikasi). Keduanya wajib
  ada supaya perintah bekerja apa pun cwd-nya.
- **`installCommand` memanggil `rebuild:native`** karena `.npmrc` mematikan
  install script. Tanpa itu `sharp` berisiko tidak ter-build dan optimisasi
  gambar `next/image` mati di produksi. Lihat "Keamanan install" di bawah.
- **Harga di database tidak ikut berubah saat `seed.ts` diedit.** `seed()` memakai plain insert tanpa menghapus, jadi menjalankannya ulang menggandakan katalog, dan menghapus lebih dulu pun tidak bisa karena `orders` menyimpan foreign key ke `products`. Untuk memperbarui produk pada database yang sudah terisi, pakai `npm run sync-products`. Stok sengaja tidak ikut ditimpa karena nilainya berubah oleh pesanan sungguhan.
- **Jangan pernah mengimpor dari `seed.ts`.** Berkas itu memanggil `seed()` di level teratas, jadi sekadar meng-import-nya menjalankan seeding. `sync-products` pernah begitu dan menyisipkan 12 produk duplikat lalu mati oleh `process.exit()` milik seed sebelum sempat bekerja. Data katalog kini tinggal di `scripts/src/catalog.ts` yang bebas efek samping — impor dari sana. Kalau terlanjur ada duplikat, jalankan `npm run dedupe-products`.
- **Tabel `swipes` harus sudah ada di database produksi.** `npm run db:push`
  dijalankan dari lokal dengan `DIRECT_URL` menunjuk ke Supabase yang sama —
  tidak ada migrasi otomatis saat deploy.

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
| `artifacts/swipe-fashion-next/app/` | Rute App Router: `/welcome`, `/feed`, `/lookbook`, `/obsessed`, `/orders`, `/style-dna`, `/account`, `/product/[id]` |
| `artifacts/swipe-fashion-next/app/api/auth/[...all]/` | Satu-satunya rute API. Milik Better Auth; dipanggil dari browser |
| `artifacts/swipe-fashion-next/lib/auth.ts` | Konfigurasi Better Auth: adapter Drizzle, email+password, cookie cache, hook klaim |
| `artifacts/swipe-fashion-next/lib/session.ts` | **Titik sambung identitas.** `getOwnerId()`, `getCurrentUser()`, `getAnonId()` |
| `artifacts/swipe-fashion-next/lib/claim.ts` | Memindahkan riwayat anonim ke akun saat login |
| `artifacts/swipe-fashion-next/lib/profile.ts` | Baca profil (nama, foto, 住所) langsung dari tabel `user`, bukan dari objek sesi |
| `artifacts/swipe-fashion-next/app/api/avatar/[userId]/` | Menyajikan foto profil sebagai JPEG dengan cache abadi |
| `artifacts/swipe-fashion-next/app/actions.ts` | Server Actions: `createOrderAction`, `superLikeAction`, `confirmOrderAction`, `cancelOrderAction` |
| `artifacts/swipe-fashion-next/lib/data.ts` | **Sumber kebenaran query baca** untuk Server Component |
| `artifacts/swipe-fashion-next/lib/taste.ts` | **Mesin selera.** Bangun profil dari swipe, skor & urutkan produk. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/outfit.ts` | **Perakit outfit** "Complete the Look". Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/payment.ts` | **Logika pembayaran demo**: deteksi penerbit kartu, Luhn, format, validasi. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/format.ts` | Konversi row DB → tipe aplikasi. Murni, diuji unit |
| `artifacts/swipe-fashion-next/lib/validation.ts` | Skema Zod input Server Action. Murni, diuji unit |
| `artifacts/swipe-fashion-next/app/globals.css` | **Sumber kebenaran design token** (warna HSL, radius, font) |
| `artifacts/swipe-fashion-next/middleware.ts` | Set cookie sesi httpOnly bila belum ada |
| `lib/db/src/schema/` | **Sumber kebenaran schema DB**: auth, categories, products, orders, super-likes, swipes |
| `scripts/src/catalog.ts` | **Sumber kebenaran katalog demo.** Data saja, tanpa efek samping |
| `scripts/src/` | Seed, sinkron produk, dedupe, set gambar, verifikasi stok |
| `scripts/generate-detail-images.py` | Membuat foto detail turunan dari tiap foto produk (`public/assets/details/`) |
| `docs/design-reference/` | Screenshot referensi visual (with.is) yang jadi acuan tema coral |

## Architecture decisions

- **Tidak ada lapisan HTTP internal.** Server Component meng-query Drizzle langsung; mutasi lewat Server Actions. Express API server, OpenAPI spec, dan client hasil Orval sudah dihapus karena tak ada yang memakainya.
- **Logika personalisasi hidup di modul murni, bukan di query.** `lib/taste.ts` dan `lib/outfit.ts` tidak menyentuh DB sama sekali — `lib/data.ts` yang mengambil baris, modul murni yang memutuskan urutan dan padanan. Itulah sebabnya keduanya bisa diuji unit tanpa harness database, dan mengapa `listProducts` tidak lagi menyimpan aturan skor sendiri.
- **Swipe kiri direkam, bukan dibuang.** Tabel `swipes` menyimpan `pass` / `like` / `super` dengan unique per sesi-produk. Tanpa sinyal negatif, profil hanya tahu apa yang disukai dan tak pernah belajar apa yang dihindari. Ini juga yang membuat produk yang sudah ditolak tidak muncul lagi di feed.
- **Nomor kartu tidak pernah menyeberang ke server.** Ia hidup di state komponen PaymentSheet saja dan hilang saat lembar ditutup. Yang dikirim ke Server Action hanyalah label hasil `paymentLabel()`, mis. `クレジットカード（Visa •••• 4242）`. Kolom `orders.paymentMethod` karena itu aman dibaca siapa pun.
- **Perekaman swipe sengaja fire-and-forget.** Animasi kartu tidak boleh menunggu jaringan; kalau satu request gagal, yang hilang cuma satu sinyal.
- **Sesi = cookie httpOnly, bukan localStorage.** Server harus bisa membaca identitas sesi untuk memfilter order dan super-like, jadi `middleware.ts` yang menerbitkannya, bukan kode klien.
- **Identitas punya satu titik sambung: `getOwnerId()` di `lib/session.ts`.** Semua data pengguna berkunci pada satu kolom `session_id`, dan fungsi itulah yang memutuskan isinya — `user.id` bila login, UUID cookie bila tidak. Karena terpusat, penambahan akun tidak mengubah satu baris pun di `lib/data.ts` maupun mesin selera. Jangan membaca sesi login langsung di halaman; lewati fungsi ini.
- **Riwayat anonim diklaim saat login, bukan dibuang.** `lib/claim.ts` memindahkan `swipes`, `super_likes`, dan `orders` dari UUID cookie ke `user.id`, dipicu dari `databaseHooks.session.create.after` — satu-satunya hook yang menangkap sign-up dan sign-in sekaligus. Urutannya wajib DELETE-lalu-UPDATE karena `swipes` dan `super_likes` punya unique(session_id, product_id); baris milik akun yang menang. Kegagalannya di-catch dan tidak boleh menggagalkan login itu sendiri.
- **`session.cookieCache` Better Auth wajib menyala.** Tanpa itu setiap render halaman menambah satu kueri sesi. Database ada di Sydney; itu berarti satu perjalanan lintas benua ekstra per halaman.
- **Semua gambar unggahan lewat `lib/storage.ts` ke Vercel Blob.** Satu modul, satu fungsi `putDataUrl` — dipakai foto profil maupun foto produk. Gambar tidak pernah masuk database; kolom `user.image` dan `products.image_url` hanya menyimpan URL. SVG sengaja tidak diterima: berkas SVG bisa memuat skrip, dan menyajikannya dari domain sendiri berarti skrip itu berjalan atas nama situsmu.
- **`next.config.ts` harus memuat `remotePatterns` untuk `*.public.blob.vercel-storage.com`.** Tanpa itu next/image menolak memuat gambar yang diunggah dan halaman tampil tanpa foto sama sekali.
- **Foto dikecilkan di klien, bukan di server.** Canvas memotongnya persegi lalu mengekspor JPEG 256px (~20 KB) sebelum dikirim. Selain menghemat unggahan, menggambar ulang lewat canvas membuang metadata EXIF termasuk koordinat GPS.
- **足あと dan いいね！履歴 tidak punya tabel sendiri.** Keduanya dibaca dari `swipes`, yang sudah merekam setiap keputusan berikut waktunya — 足あと adalah semua arah, いいね！履歴 adalah `like` + `super`.
- **Peran admin tidak pernah datang dari klien.** `user.additionalFields.role` di lib/auth.ts memakai `input: false`, yang membuat Better Auth membuang field itu dari permintaan pendaftaran — termasuk permintaan buatan sendiri yang menyisipkan `role: "admin"`. Satu-satunya jalur pemberian peran adalah `npm run make-admin -- email@kamu.com`.
- **`requireAdmin()` dipanggil di setiap halaman DAN setiap Server Action admin, bukan sekali di layout.** Layout tidak berjalan saat Server Action dipanggil langsung lewat HTTP, dan Server Action itulah yang benar-benar mengubah data. Menjaga layout saja berarti mengunci pintu sementara jendelanya terbuka.
- **Peran dibaca langsung dari database, bukan dari objek sesi.** Sesi disalin ke cookie cache selama beberapa menit; kalau hak admin dicabut, salinan itu masih menyebutnya admin sampai kedaluwarsa. Untuk pemeriksaan izin, jeda beberapa menit terlalu panjang.
- **Middleware hanya memeriksa keberadaan cookie sesi untuk `/admin`.** Ia berjalan di edge runtime dan tidak bisa membaca database, jadi tidak mungkin tahu peran seseorang. Itu kenyamanan, bukan pengaman.
- **Produk diarsipkan, tidak pernah dihapus.** `swipes`, `super_likes`, dan `orders` semuanya menunjuk ke `products.id`. Menghapus barisnya membuat riwayat pesanan kehilangan nama barangnya, atau gagal dengan pelanggaran foreign key yang pesannya tidak bisa dipahami siapa pun. `isArchived` menyaringnya dari feed dan katalog.
- **Panel admin sengaja untuk desktop.** Yang mobile-only adalah tokonya, karena swipe adalah gestur sentuh. Panel admin adalah alat kerja — formulir tiga belas kolom dengan pratinjau di sebelahnya hanya masuk akal di layar lebar. Karena itu `/admin` tidak memakai `AppLayout`.
- **Pratinjau formulir produk memakai komponen `ProductCard` yang sama dengan feed**, bukan tiruan. Kalau kartu aslinya berubah, pratinjau ikut berubah, dan keduanya tidak bisa berbeda diam-diam.
- **Gerbang login sengaja lunak.** Hanya checkout yang memerlukan akun. Swipe, 一目惚れ, dan Style DNA tetap terbuka tanpa mendaftar — premis produknya "buka tautan, langsung swipe", dan halaman pendaftaran di depan pintu membunuh itu. Ajakan mendaftar diletakkan di Style DNA (ambang 5 swipe), bukan di feed, karena kartu feed memenuhi layar dan banner apa pun akan menutupi foto atau tombol aksi.
- **Dua connection string Supabase.** Runtime memakai transaction pooler (6543) dengan `max: 1` karena tiap instance Vercel punya pool sendiri; DDL memakai direct (5432) karena pooler tidak mendukung DDL.
- **Vitest hanya untuk modul murni.** Tidak ada harness test DB. Halaman dan Server Action diverifikasi lewat `next build`, `tsc --noEmit`, dan pemeriksaan manual.
- **Gestur swipe hanya aktif di area foto kartu feed.** Badan kartu bisa di-scroll, dan drag framer-motion ikut menangkap gerakan vertikal — kalau drag dipasang pada seluruh kartu, menggulir tabel 基本情報 malah menyeret kartunya. Karena itu `dragListener={false}` dan drag dimulai manual lewat `useDragControls` dari area foto saja.
- **Ukuran produk disimpan sebagai `jsonb`, bukan kolom terpisah.** Tiap kategori punya set ukuran berbeda: atasan diukur 着丈/身幅/肩幅/袖丈, bawahan diukur ウエスト/股上/股下/わたり幅. Sebagai kolom, separuhnya akan selalu NULL dan "肩幅 celana" tampil janggal. Urutan kunci di objek dipertahankan saat dirender.
- **Nama variabel CSS `--app-font-sans` / `--app-font-serif` / `--app-font-mono` tidak boleh berubah** — seluruh JSX bergantung pada kelas `font-serif` / `font-sans` yang di-map ke sana.

## Product

- **Welcome** — halaman masuk. `/` mengarah ke sini. Halaman `/landing` yang dulu menganggur sudah dihapus.
- **Feed** — kartu produk bergaya profil: carousel foto dengan strip thumbnail di atas, lalu 商品説明 dan tabel 基本情報 (kategori, brand, 素材, カラー, サイズ展開, ukuran detail, 評価, 在庫) yang bisa di-scroll. Like memunculkan match overlay, super-like menyimpan ke koleksi 一目惚れ. Urutan feed ditentukan mesin selera.
- **Style DNA** — visualisasi apa yang dipelajari aplikasi dari swipe-mu: kategori yang dicari dan dihindari, label, palet warna, rentang harga, dan tingkat keyakinan. Punya gambar OG untuk di-share.
- **Complete the Look** — outfit yang dirakit otomatis dari koleksi Obsessed (atasan + bawahan, atau dress, ditumpuk luaran).
- **Lookbook** — grid katalog dengan filter kategori lewat query string URL.
- **Product detail** — halaman produk dengan metadata SEO dan tag OpenGraph yang ter-render di server.
- **Obsessed** — koleksi produk yang di-super-like pada sesi ini.
- **Orders** — buat, bayar, dan batalkan pesanan. Membatalkan mengembalikan stok.
- **Pembayaran (demo)** — alur berlangkah dengan lima metode: クレジットカード, PayPay, コンビニ払い, Apple Pay, 代金引換. Formulir kartu memvalidasi checksum Luhn, mendeteksi penerbit dari awalan nomor, dan menyesuaikan panjang CVC. **Simulasi penuh** — tidak ada penyedia pembayaran yang dihubungi.

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
- **Bahasa antarmuka: Jepang.** Nama produk, deskripsi, warna, dan nama brand sengaja dibiarkan huruf Latin di database — itu justru wajar di situs fashion Jepang. Yang diterjemahkan hanya lapisan tampilan. Label kategori dipetakan di `lib/format.ts` (`categoryLabel`), bukan di database, karena slug-nya juga dipakai sebagai filter URL.
- **Gambar OG Style DNA tetap berbahasa Inggris.** `ImageResponse` merender dengan font yang disediakan sendiri, dan font bawaannya tidak punya glif Jepang — teks Jepang akan keluar sebagai kotak kosong. Menyediakan font Jepang berarti mengunduh berkas font saat request. Kartu bermerek berhuruf Latin dinilai lebih aman.

## Pointers

- Struktur workspace didefinisikan di field `workspaces` pada `package.json` root: `artifacts/*`, `lib/*`, `scripts`.
