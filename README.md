# SwipeFash

**スワイプで出会う、次の一着。** — aplikasi belanja fashion yang mengganti pencarian dengan insting.

Alih-alih menelusuri grid dan filter, pengguna men-*swipe* satu per satu seperti aplikasi kencan: geser kanan untuk suka, kiri untuk lewat, atas untuk simpan. Setiap keputusan — **termasuk yang ditolak** — melatih profil selera yang menyusun ulang urutan feed.

**Demo langsung:** https://swipe-fashion-code-swipe-fashion-ne-coral.vercel.app

> Buka dari ponsel, atau dari laptop dengan jendela browser diperkecil.

---

## Ini *mobile-only web app*

Bukan situs responsif yang kebetulan muat di ponsel — dirancang khusus untuk layar ponsel, dan itu keputusan produk, bukan keterbatasan.

Alasannya: interaksi intinya adalah **swipe**, gestur sentuh yang tidak ada di desktop. Membuat versi desktop berarti menyisakan tombol klik saja, dan seluruh premis produk — *"jangan cari, cukup geser"* — kehilangan maknanya.

Di layar besar, aplikasi tetap disajikan rapi di dalam bingkai perangkat, bukan direntangkan jadi tata letak yang tidak pernah dirancang.

---

## Fitur

### 1. Feed swipe

Kartu produk bergaya profil: carousel foto, deskripsi, dan tabel 基本情報 lengkap dengan ukuran per kategori (着丈・身幅・肩幅 untuk atasan, ウエスト・股上・股下 untuk bawahan). Geser mendatar untuk memutuskan, geser tegak untuk membaca detail.

### 2. Style DNA — mesin selera

Inti pembeda aplikasi ini. **Setiap swipe direkam, termasuk swipe kiri.**

Kebanyakan aplikasi serupa hanya belajar dari apa yang disukai. SwipeFash memberi bobot pada penolakan juga:

| Aksi | Bobot |
|---|---|
| スーパーライク | +3 |
| いいね | +1 |
| パス | **−1** |

Dari sinyal itu dibangun profil berbobot atas **kategori, brand, warna, dan rentang harga**, lalu feed diurutkan ulang. Halaman `/style-dna` memperlihatkan apa yang dipelajari — termasuk bagian *「見送るもの」*, yang hanya mungkin ada karena penolakan ikut dicatat.

Satu keputusan yang perlu digarisbawahi: **rentang harga hanya dibangun dari barang yang disukai.** Barang mahal yang ditolak tidak menggeser anggaran, karena penolakan bisa saja soal modelnya, bukan harganya.

### 3. Complete the Look

Koleksi 一目惚れ dirakit otomatis jadi coordinate: atasan + bawahan, atau dress, ditumpuk luaran. Tiap potong dipakai maksimal sekali agar tidak terasa daur ulang.

### 4. Terpasang seperti aplikasi (PWA)

Buka dari ponsel, ketuk **ホーム画面に追加**, dan SwipeFash muncul sebagai ikon di layar utama — terbuka **layar penuh tanpa address bar**, dengan splash screen dan bilah status berwarna coral.

Inilah bukti dari klaim *mobile-only* di atas: bukan sekadar pernyataan, tapi sesuatu yang bisa dirasakan juri di ponsel mereka sendiri dalam sepuluh detik.

Ajakan pemasangan muncul otomatis di dalam aplikasi, karena Android menyembunyikan opsinya di menu tiga titik dan iOS lebih dalam lagi — fitur yang tidak terlihat sama saja dengan tidak ada.

### 5. Pembayaran (demo)

Alur checkout berlangkah dengan lima metode yang lazim di Jepang:

**クレジットカード** · **PayPay** · **コンビニ払い** · **Apple Pay** · **代金引換**

Formulir kartunya sungguhan secara logika, bukan tempelan:

- Deteksi penerbit dari awalan nomor — Visa, Mastercard, **JCB**, AMEX, Diners, Discover
- Pengelompokan digit sesuai penerbit (AMEX 4-6-5, sisanya per 4)
- Validasi checksum **Luhn** — menangkap salah ketik sebelum formulir dikirim
- Panjang CVC menyesuaikan penerbit (AMEX 4 digit, lainnya 3)
- Kedaluwarsa sah sampai akhir bulan yang tertera

> **Ini simulasi.** Tidak ada uang berpindah dan tidak ada penyedia pembayaran yang dihubungi. **Nomor kartu tidak pernah dikirim ke server maupun disimpan** — yang tercatat hanya label seperti `クレジットカード（Visa •••• 4242）`. Nomor uji tersedia langsung di dalam formulir agar tidak ada yang tergoda memakai kartu asli.

### 6. Akun (opsional)

Daftar dengan email dan password, atau **jangan sama sekali** — semua fitur tetap jalan tanpa akun.

Gerbangnya sengaja dibuat lunak. Premis produk ini adalah *"buka tautan, langsung swipe"*, dan halaman pendaftaran di depan pintu akan membunuhnya. Jadi hanya **checkout** yang benar-benar memerlukan akun, karena pesanan butuh identitas yang bertahan lebih lama dari sebuah cookie.

Bagian yang paling penting justru tidak terlihat: **riwayat swipe ikut berpindah.** Kamu bisa swipe 10 barang sebagai tamu, baru mendaftar — dan Style DNA-mu tetap utuh, sekarang tersimpan di akun dan bisa dibuka dari perangkat lain.

Dibangun dengan **Better Auth**: tabelnya ada di Postgres yang sama, password di-hash dengan Argon2id, sesi disimpan di database dan dibawa lewat cookie httpOnly. Tidak ada layanan autentikasi pihak ketiga.

**マイページ** berisi foto profil yang bisa diganti, **足あと** (semua yang pernah dilihat di feed), **いいね！履歴**, dan **お届け先**. Alamat yang sudah terdaftar mengisi langkah pengiriman secara otomatis — checkout berikutnya tidak perlu mengetik ulang.

---

## Panduan singkat untuk penguji

1. **Buka dari ponsel** dan ketuk ajakan **ホーム画面に追加** — pengalamannya berbeda begitu berjalan layar penuh.
2. **`/feed`** — swipe 5–6 barang dengan pola jelas. Misalnya: sukai semua アウター, tolak semua ボトムス.
3. **`/style-dna`** — profil sudah terbentuk. Perhatikan bagian *「見送るもの」* — itu bukti aplikasi belajar dari penolakan, bukan hanya dari kesukaan.
4. **Kembali ke `/feed`** — urutannya sudah berubah.
   Di bawah hasil Style DNA ada ajakan **アカウントを作成**. Daftar di situ, lalu buka lagi `/style-dna` — hasilnya tetap sama persis. Itulah buktinya riwayat tamu ikut dipindahkan ke akun, bukan dibuang.
5. **`/一目惚れ`** — lihat coordinate yang dirakit dari barang yang disimpan.
6. **`/orders`** → **お支払いへ進む** — coba alur pembayaran. Ketuk salah satu nomor uji di formulir kartu, atau pilih PayPay untuk melihat layar QR.

---

## Keputusan teknis

**Logika inti hidup di modul murni, bukan di query.** `lib/taste.ts`, `lib/outfit.ts`, dan `lib/payment.ts` tidak menyentuh database sama sekali — lapisan data mengambil baris, modul murni yang memutuskan urutan, padanan, dan keabsahan. Konsekuensinya semuanya bisa diuji unit tanpa harness database: **60+ unit test** menutupi bobot selera, aturan penyusunan outfit, dan validasi kartu.

**Tidak ada lapisan HTTP internal.** Server Component meng-query Drizzle langsung; mutasi lewat Server Actions. API server Express beserta client hasil generate sudah dihapus karena tak ada yang memakainya.

**Identitas punya satu titik sambung, bukan tersebar.** Semua data pengguna berkunci pada satu kolom `session_id`. Satu fungsi — `getOwnerId()` — memutuskan isinya: `user.id` kalau sudah login, UUID cookie kalau belum. Karena keputusan itu terpusat, menambahkan akun **tidak mengubah satu baris pun** di lapisan data maupun mesin selera. Saat seseorang mendaftar, baris-baris lamanya dipindahkan ke id akun, jadi tidak ada riwayat yang hilang.

**Perekaman swipe sengaja *fire-and-forget*.** Animasi kartu tidak boleh menunggu jaringan; kalau satu request gagal, yang hilang cuma satu sinyal.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · framer-motion · Drizzle ORM · PostgreSQL (Supabase) · Vitest · PWA · Vercel

---

## Menjalankan secara lokal

```bash
npm install
npm run rebuild:native
```

Salin `artifacts/swipe-fashion-next/.env.local.example` ke `.env.local`, isi connection string Supabase, lalu:

```bash
npm run db:push
npm run seed
npm run dev
```

Aplikasi berjalan di `http://localhost:20100`.

```bash
npm test        # unit test
npm run build   # typecheck + production build
```

Detail arsitektur, jebakan yang sudah diketahui, dan panduan deploy ada di [`PROJECT.md`](./PROJECT.md).

---

## Batasan yang diketahui

Disebutkan terbuka, bukan disembunyikan:

- **Pembayaran adalah simulasi.** Tidak terhubung ke penyedia mana pun.
- **Katalog berisi 12 produk.** Cukup untuk memperlihatkan mesin seleranya bekerja, tapi feed akan cepat habis.
- **Foto kedua tiap produk adalah crop dari foto utamanya**, bukan pemotretan terpisah.
- **Akun belum diverifikasi lewat email.** Pendaftaran langsung aktif; tidak ada email konfirmasi maupun reset password, karena keduanya memerlukan layanan pengiriman email terpisah.
- **Belum ada peran admin.** Katalog masih diisi lewat skrip, belum lewat antarmuka.
- **Foto profil disimpan di Postgres, bukan di object storage.** Dikecilkan ke 256px lebih dulu dan diletakkan di tabel terpisah agar tidak membebani pembacaan sesi, tapi tempat yang benar untuk gambar adalah Vercel Blob atau S3. Jalur pindahnya sudah disiapkan: seluruh aplikasi hanya membaca URL dari satu kolom.
- **Tidak ada mode offline.** PWA-nya bisa dipasang, tapi hampir semua halaman butuh database — service worker sengaja tidak dipasang daripada menyajikan konten basi.
- **Swipe ke atas untuk super like dilepas** ketika area foto dibuat bisa di-scroll — dua gestur itu tidak bisa berbagi sumbu yang sama. Tombol ★ menggantikannya.
