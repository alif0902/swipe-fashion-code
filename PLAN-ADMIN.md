# Rencana: Akun Admin

Status: **rencana, belum dikerjakan**
Prasyarat: fitur akun consumer sudah terpasang dan terverifikasi (`PLAN-AUTH.md`)

## Keputusan yang sudah diambil

| Pertanyaan | Pilihan |
|---|---|
| Cara jadi admin | Kolom `role` di tabel `user` + skrip promosi |
| Unggah foto produk | Vercel Blob |
| Fungsi utama | Dashboard + kelola produk (termasuk foto) |

---

## Prinsip keamanan yang tidak boleh dilanggar

Ini bagian yang paling mudah salah, dan salahnya mahal. Ditulis di depan supaya jadi acuan tiap tahap.

**1. Peran tidak pernah datang dari klien.**
Formulir pendaftaran tidak boleh menerima field `role`, dan Better Auth harus dikonfigurasi agar mengabaikannya kalau dikirim. Kalau seseorang bisa menyisipkan `role: "admin"` ke permintaan sign-up, seluruh sistem ini tidak ada artinya. Nilai bawaannya selalu `"user"`.

**2. Tidak ada UI untuk mengangkat admin.**
Promosi dilakukan lewat skrip yang kamu jalankan di terminalmu sendiri. Halaman "jadikan admin" adalah target serangan yang tidak perlu ada — kamu cuma butuh satu admin.

**3. Middleware bukan pengaman, hanya kenyamanan.**
Middleware berjalan di edge runtime dan **tidak bisa membaca database**, jadi ia tidak bisa tahu peran seseorang. Ia hanya bisa memeriksa "ada cookie sesi atau tidak" untuk mengalihkan tamu lebih awal.

Pemeriksaan yang sesungguhnya harus ada di **setiap halaman dan setiap Server Action** di bawah `/admin`. Bukan sekali di layout — layout tidak melindungi Server Action, dan Server Action adalah yang benar-benar mengubah data.

**4. Satu fungsi penjaga, dipakai di semua tempat.**
`requireAdmin()` di `lib/session.ts`: melempar atau redirect kalau bukan admin, mengembalikan user kalau iya. Baris pertama di setiap halaman dan aksi admin. Kalau ada satu tempat yang lupa memanggilnya, di situ lubangnya — jadi lebih baik satu fungsi yang selalu sama daripada pemeriksaan yang ditulis ulang tiap kali.

---

## Yang dibangun

### A. Dashboard

Bukan sekadar hiasan — datanya sudah ada di databasemu dan belum pernah dilihat siapa pun.

**Ringkasan:** jumlah produk, pengguna terdaftar, total swipe, pesanan, dan nilai pesanan.

**Yang paling menarik untuk juri — performa per produk:**

| Kolom | Artinya |
|---|---|
| いいね率 | like ÷ total swipe pada produk itu |
| 見送り率 | pass ÷ total swipe |
| 一目惚れ | jumlah super like |
| 購入 | jumlah pesanan |

Ini memperlihatkan **sisi lain dari mesin seleramu**. Style DNA menunjukkan apa yang dipelajari tentang satu orang; dashboard menunjukkan apa yang dipelajari tentang katalog secara keseluruhan. Produk dengan 見送り率 90% adalah temuan bisnis yang nyata, dan itu hanya mungkin karena kamu merekam swipe kiri — keputusan yang sudah kamu ambil sejak awal.

Semua dihitung dari tabel yang ada. **Tidak ada tabel analitik baru.**

### B. Kelola produk

- Daftar produk dengan pencarian
- Tambah produk: unggah foto (bisa lebih dari satu), isi nama, brand, harga, kategori, gender, ukuran, warna, material, dimensi, stok
- Sunting dan hapus produk

Formulirnya cukup panjang karena tabel `products` punya banyak kolom. Sebagian bisa dibuat opsional dengan nilai bawaan yang masuk akal, supaya menambah satu produk tidak terasa seperti mengisi formulir pajak.

---

## Tahapan

### Tahap 0 — Vercel Blob · ~½ hari

Buat Blob store di dashboard Vercel (Storage → Create → Blob), token masuk otomatis ke project.

`lib/storage.ts` — satu modul dengan satu fungsi `putImage(file, prefix)`. Lalu pindahkan `updateAvatarAction` ke sana.

Dikerjakan lebih dulu karena dua alasan: unggah foto produk bergantung padanya, dan ini sekaligus melunasi utang teknis foto profil yang sekarang masih base64 di Postgres. Setelah ini, tabel `user_avatars` bisa dihapus.

### Tahap 1 — Peran dan penjaga · ~1 hari

- `roleEnum` (`user` / `admin`) dan kolom `role` di `userTable`, default `"user"`
- Konfigurasi Better Auth: `role` sebagai additional field dengan **input dari klien dimatikan**
- `requireAdmin()` di `lib/session.ts`
- `scripts/src/make-admin.ts` — `npm run make-admin -- email@kamu.com`
- Middleware mengalihkan tamu dari `/admin` lebih awal (kenyamanan, bukan pengaman)
- Entri アドミン di マイページ, **hanya muncul kalau perannya admin**

*Berhenti di sini: belum ada halaman admin, tapi fondasi keamanannya sudah berdiri.*

### Tahap 2 — Kerangka dan dashboard · ~2 hari

- `app/admin/layout.tsx` dengan `requireAdmin()` dan navigasi sendiri
- `lib/admin-stats.ts` — kueri agregat, dijalankan bersamaan lewat `Promise.all`
- `app/admin/page.tsx` — kartu ringkasan dan tabel performa produk

Catatan performa: statistik per produk adalah satu kueri `GROUP BY` di atas `swipes`, bukan satu kueri per produk. Database di Sydney; sepuluh kueri berarti sepuluh perjalanan lintas benua.

*Berhenti di sini: dashboard-nya sudah bisa didemokan.*

### Tahap 3 — Unggah foto produk · ~1–2 hari

- Server Action `uploadProductImageAction`, dijaga `requireAdmin()`
- Foto dikecilkan di klien seperti avatar, tapi ke lebar feed, bukan 256px
- Pratinjau, urutkan, hapus sebelum disimpan — foto pertama jadi `imageUrl`, sisanya masuk `images`

### Tahap 4 — CRUD produk · ~2 hari

- `app/admin/products/` — daftar, tambah, sunting, hapus
- Skema Zod baru di `lib/validation.ts` + unit test, mengikuti pola modul murni yang sudah ada
- Hapus produk: tolak kalau masih ada pesanan yang menunjuk ke sana, jangan biarkan foreign key yang gagal jadi pesan errornya

### Tahap 5 — Verifikasi dan dokumentasi · ~1 hari

- `npm test`, `npm run build`
- **Uji keamanan secara sengaja:** buka `/admin` sebagai tamu, lalu sebagai user biasa. Keduanya harus ditolak. Panggil Server Action admin dari akun biasa — harus ditolak juga
- README dan PROJECT.md

**Total ± 7–8 hari kerja.**

---

## Untuk penjurian

Sediakan **satu akun admin demo** dengan kredensial yang kamu tulis di README, dan pastikan ia hanya bisa mengubah katalog — bukan melihat data pribadi pengguna lain. Juri yang bisa masuk sendiri ke dashboard akan menilai fitur ini jauh lebih tinggi daripada juri yang hanya membaca deskripsinya.

---

## Risiko

**Formulir produk itu panjang.** Tiga belas kolom, dua di antaranya array dan satu jsonb. Ini bagian yang paling membosankan dan paling mudah diremehkan waktunya. Kalau jadwal ketat, kecilkan dulu: nama, brand, harga, kategori, gender, foto, stok. Sisanya menyusul.

**`dimensions` bertipe jsonb dengan kunci bebas.** Antarmukanya perlu pasangan kunci-nilai yang bisa ditambah, bukan kolom tetap — karena set ukurannya berbeda antara atasan dan bawahan.

**Menghapus produk menyentuh data lain.** `swipes`, `super_likes`, dan `orders` semuanya menunjuk ke `products.id`. Putuskan sejak awal: tolak penghapusan kalau ada pesanan, atau tandai produk sebagai arsip alih-alih menghapusnya. Yang kedua lebih aman dan lebih mudah dijelaskan.
