# Rencana: Akun Pengguna (Consumer)

Status: **rencana, belum dikerjakan**
Cakupan: hanya akun consumer/client. Admin dibahas di rencana terpisah.

## Keputusan yang sudah diambil

| Pertanyaan | Pilihan |
|---|---|
| Gerbang login | **Lunak** — bisa swipe tanpa daftar, diminta login saat checkout |
| Verifikasi email | **Belum** — email sebagai identitas saja, akun langsung aktif |
| Login Google | **Belum** — email + password dulu |
| Pustaka auth | **Better Auth** |

---

## Kenapa Better Auth

Empat kandidat dipertimbangkan:

**Auth.js (NextAuth v5)** — login email+password sengaja dibuat kelas dua di sana. Kamu harus menulis sendiri provider `Credentials`, hashing password, dan pengecekannya. Sesi juga didorong ke JWT, artinya kamu tidak bisa mencabut sesi dari sisi server. Untuk kasus "email + password" ini justru pilihan tersulit.

**Supabase Auth** — menggoda karena databasemu memang Supabase. Tapi aplikasimu **tidak memakai Supabase client sama sekali** — ia bicara ke Postgres langsung lewat Drizzle. Mengadopsi Supabase Auth berarti menambah jalur akses data kedua, dan baris pengguna tinggal di skema `auth` yang tidak dikelola Drizzle. Pasangan alaminya adalah RLS, yang juga tidak kamu pakai.

**Clerk** — paling cepat jadi dan tampilannya paling rapi, tapi ia layanan pihak ketiga. Untuk lomba itu dua risiko: juri melihat modal ber-merek Clerk alih-alih desainmu sendiri, dan ada ketergantungan eksternal yang bisa habis kuota atau mati saat penjurian.

**Better Auth** — dipilih karena:

- Tabelnya hidup di Postgres milikmu sendiri, di-generate untuk Drizzle → alur `npm run db:push` yang sudah ada tetap dipakai
- Email + password kelas satu, hashing pakai **Argon2id**
- Sesi disimpan di database dan dibawa lewat **cookie httpOnly** — persis model yang sudah kamu pakai sekarang, jadi cara berpikirnya tidak berubah
- Punya plugin `admin` dengan peran (role) → rencana admin berikutnya jadi soal konfigurasi, bukan tulis ulang
- Tanpa vendor, tanpa biaya bulanan, tanpa layanan luar yang bisa mati

---

## Temuan kunci: pekerjaannya jauh lebih kecil dari dugaan

Seluruh data pengguna di aplikasi ini — `swipes`, `super_likes`, `orders` — sudah berkunci pada **satu kolom yang sama**: `session_id`, yang isinya UUID acak dari cookie.

Artinya ada **satu titik sambung tunggal** yang perlu diubah, yaitu `lib/session.ts`:

```
Sekarang:  getSessionId() → UUID dari cookie
Nanti:     getOwnerId()   → sudah login ? user.id : UUID dari cookie
```

Konsekuensinya: **`lib/data.ts`, `app/actions.ts`, feed, style-dna, obsessed, dan orders tidak perlu diubah sama sekali.** Kueri mereka tetap `WHERE session_id = ...`; yang berubah hanya nilai yang masuk ke sana.

Ini keputusan arsitektur yang sudah kamu buat lebih dulu tanpa sengaja, dan sekarang terbayar.

---

## Yang perlu dipindahkan saat orang mendaftar

Ini bagian yang paling gampang dilupakan dan paling merusak kalau salah.

Skenarionya: juri membuka aplikasi, swipe 6 barang, Style DNA-nya sudah terbentuk — lalu ia mendaftar. Kalau login sekadar membuat baris user baru, **seluruh riwayat swipe tadi jadi yatim** dan Style DNA-nya kosong lagi. Fitur andalanmu justru rusak tepat di momen yang paling dilihat juri.

Jadi harus ada langkah **klaim**: begitu sign-up atau sign-in berhasil, semua baris dengan `session_id` = UUID anonim dipindahkan ke `session_id` = `user.id`.

Satu jebakan di sini: tabel `swipes` punya `unique(session_id, product_id)`. Kalau akun itu sudah punya swipe untuk produk yang sama, `UPDATE` biasa akan menabrak constraint. Urutannya harus:

1. Hapus dulu baris **anonim** yang produknya sudah ada di akun (baris akun yang menang — deterministik)
2. Baru `UPDATE` sisanya

`orders` tidak punya constraint unik, jadi cukup `UPDATE` langsung.

---

## Tabel baru

Better Auth butuh empat tabel: `user`, `session`, `account`, `verification`. Digenerate ke `lib/db/src/schema/auth.ts` lalu diekspor dari `schema/index.ts`, sehingga ikut `npm run db:push` seperti tabel lain.

> Catatan penamaan: tabel `session` milik Better Auth **bukan** hal yang sama dengan "session" anonim yang selama ini kamu pakai. Yang pertama adalah sesi login; yang kedua sekadar UUID di cookie. Dua konsep berbeda dengan nama mirip — di kode, yang anonim akan kuberi nama `anonId` supaya tidak tertukar.

---

## Tahapan kerja

### Tahap 1 — Pemasangan dan skema

- `npm i better-auth` di `artifacts/swipe-fashion-next`
- Generate skema auth → `lib/db/src/schema/auth.ts`, ekspor dari `index.ts`
- `lib/auth.ts` — konfigurasi `betterAuth` dengan `drizzleAdapter`, `emailAndPassword.enabled = true`, `requireEmailVerification = false`
- `app/api/auth/[...all]/route.ts` — handler Next.js
- Env baru: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `npm run db:push`

### Tahap 2 — Titik sambung identitas

- `lib/session.ts`: `getSessionId()` → `getOwnerId()`, membaca sesi login dulu, jatuh ke cookie anonim kalau belum login
- **Aktifkan `session.cookieCache`.** Tanpa ini setiap render halaman menambah satu kueri ke database. Mengingat databasemu di Sydney, itu langsung mengembalikan masalah lambat yang baru saja kita perbaiki. Dengan cookie cache, pengecekan sesi tidak menyentuh database untuk beberapa menit.
- Ganti nama pemanggilan di 6 berkas (murni rename, tanpa perubahan logika)

### Tahap 3 — Klaim data anonim

- `lib/claim.ts` — fungsi murni untuk menentukan baris mana yang dipindah dan mana yang dibuang, plus lapisan tipis yang menjalankan transaksinya
- Unit test untuk aturan tabrakannya (sejalan dengan gaya `taste.ts` dan `payment.ts` yang sudah ada)
- Dipanggil lewat hook `after` sign-up dan sign-in Better Auth

### Tahap 4 — Validasi sebagai modul murni

- Tambahkan skema email dan password ke `lib/validation.ts` yang sudah ada
- Aturan kekuatan password ditulis sebagai fungsi murni + unit test — cocok dengan cerita arsitektur yang sudah kamu tulis di README

### Tahap 5 — Antarmuka

- `components/auth-sheet.tsx` — satu Drawer (pakai `vaul`, sudah terpasang untuk filter dan pembayaran) berisi dua tab: **新規登録** dan **ログイン**
- `app/account/page.tsx` — profil, ringkasan Style DNA, tombol keluar
- Entri akun di `BottomNav`
- Semua teks dalam bahasa Jepang, mengikuti sisa aplikasi

Drawer dipilih, bukan halaman terpisah, karena gerbangnya lunak: ajakan login muncul di tengah alur, dan memindahkan orang ke halaman lain akan memutus konteksnya.

### Tahap 6 — Titik pemicu gerbang lunak

- **Checkout wajib login** — pesanan butuh identitas, dan ini satu-satunya tempat yang benar-benar memerlukannya
- **Setelah 5 swipe** — banner sekali saja: *「アカウントを作ると、好みが他の端末でも引き継がれます」*
- Halaman Style DNA — ajakan halus di bawah hasil
- Swipe, super like, dan 一目惚れ **tetap terbuka tanpa akun**

### Tahap 7 — Verifikasi

- `npm test` dan `npm run build`
- Telusuri manual: anonim → swipe 6 → daftar → pastikan Style DNA **tidak** kosong
- Uji ulang: keluar → masuk lagi → data tetap ada
- Perbarui `README.md` (hapus batasan "Tanpa akun") dan `PROJECT.md`

---

## Yang tidak berubah

Layak dicatat karena inilah alasan rencana ini tidak berisiko besar:

- `lib/data.ts` — nol perubahan
- `app/actions.ts` — hanya nama fungsi yang dipanggil
- Mesin selera, perakit outfit, logika pembayaran — nol perubahan
- Semua unit test yang ada sekarang — tetap lolos tanpa disentuh

---

## Risiko dan jebakan

**Latensi.** Pengecekan sesi adalah kueri database tambahan di setiap request. Cookie cache wajib dinyalakan, bukan opsional.

**Middleware.** Jangan panggil database dari `middleware.ts` — ia berjalan di edge runtime. Cookie anonim tetap diset di sana seperti sekarang; pengecekan login dilakukan di Server Component.

**Variabel environment di Vercel.** `BETTER_AUTH_SECRET` harus ditambahkan di dashboard Vercel juga. Kalau lupa, produksi gagal sementara lokal jalan — jenis kegagalan yang paling membingungkan.

**Cookie anonim tetap dipertahankan** setelah login. Tidak dihapus, supaya kalau pengguna keluar ia kembali ke keranjang lamanya alih-alih ke keadaan kosong.

---

## Yang perlu kamu siapkan

Praktis tidak ada. Tidak ada pendaftaran layanan luar, tidak ada API key pihak ketiga, tidak ada domain. Hanya satu nilai rahasia acak yang kubuatkan dan kamu tempel ke `.env.local` dan Vercel.

---

## Nilai tambah untuk lomba

README-mu sekarang mencantumkan *"Tanpa akun — berganti perangkat berarti mulai dari nol"* sebagai batasan yang diketahui. Rencana ini menghapus batasan itu, dan menggantinya dengan sesuatu yang bisa didemokan: **selera yang sudah dipelajari ikut berpindah perangkat.**

Yang perlu dijaga: jangan sampai penambahan akun merusak kesan "buka tautan, langsung swipe" yang jadi kekuatan aplikasi ini. Itu sebabnya gerbangnya lunak.

---

## Setelah ini: admin

Sudah disiapkan jalannya, bukan dipikirkan belakangan. Plugin `admin` Better Auth menambahkan kolom `role` ke tabel `user`. Rencana admin nanti tinggal membahas: penjaga rute `/admin`, unggah gambar produk (butuh penyimpanan — kemungkinan Vercel Blob atau Supabase Storage), dan CRUD produk.
