# Rencana: コーデ投稿 — "Everyone Can Be a Model"

Status: **rencana, belum dikerjakan**
Waktu tersedia: **2–3 minggu**
Cakupan yang dipilih: **tanpa komisi.** Posting outfit masuk feed dan bisa dibeli; bagi hasil kreator ditulis sebagai arah berikutnya di README, bukan dibangun.

---

## Kenapa komisi dibuang

Menghitung 10% itu satu baris perkalian. Yang berat adalah semua yang menempel padanya: perjanjian dengan brand, jalur pembayaran keluar, verifikasi identitas penerima, pajak, dan penyelesaian sengketa. Tidak satu pun bisa dibereskan dalam tiga minggu, dan membangun buku besar yang tidak akan pernah membayar siapa pun sama saja dengan membangun properti panggung.

Ceritanya tetap utuh tanpa itu. *"Semua orang bisa jadi wajah dari pakaian ini"* sudah lengkap begitu pos orang sungguhan muncul di feed dan barangnya bisa dibeli. Komisi adalah babak berikutnya, dan roadmap yang ditulis sadar batas justru dihargai — bukan dianggap kurang.

---

## Keputusan bentuk: pos menandai barang dari katalog

Ini bagian yang paling mudah terlewat, jadi ditulis di depan.

Kalau aku mengunggah foto diriku memakai jaket, **aplikasi tidak punya cara tahu jaket itu barang yang mana.** Padahal seluruh rantainya — swipe kanan → checkout — bergantung pada foto itu tersambung ke sesuatu yang bisa dibeli. Mengetik nama brand bebas membuat pos tidak bisa dibeli; pengenalan gambar di luar jangkauan.

Jadi kreator **menandai 1–3 barang dari katalog** yang muncul di fotonya.

Janjinya berubah, dan perubahannya menguntungkan:

> Bukan *"posting pakaian apa pun milikmu"*
> melainkan *"posting caramu memakai barang yang ada di toko ini"*

Katalog 12 barang berhenti jadi kelemahan dan jadi batasan yang berguna: satu jaket, dua puluh gaya, dua puluh orang. Feed jadi **dalam**, bukan lebar — dan setiap pos otomatis bisa dibeli.

---

## Yang berubah di arsitektur

**Feed jadi dua jenis konten.** Sekarang `listProducts` mengembalikan `AppProduct[]`. Ia jadi `FeedItem = ProductItem | OutfitPostItem`. Ini perubahan paling menyebar dan paling berisiko — `swipe-feed.tsx` dan `product-card.tsx` sama-sama menganggap satu bentuk data. Dikerjakan di tahap tersendiri karena itu.

**Swipe pada pos tetap merekam sinyal produk.** Kalau tidak, Style DNA berhenti belajar begitu feed didominasi pos. Satu swipe pada pos = satu sinyal untuk **setiap** barang yang ditandai di dalamnya. Mesin selera tidak perlu tahu pos itu ada.

**Dimensi `creator` di mesin selera — ditunda.** Menyukai gaya seseorang idealnya menaikkan pos lain dari orang itu. Itu penambahan bersih pada modul murni yang sudah teruji, tapi bukan syarat agar fiturnya hidup. Masuk daftar "kalau waktu tersisa".

**Foto pos wajib di object storage.** Avatar 256px (~20 KB) masih bisa dipertahankan di Postgres. Foto outfit ukuran feed 150–300 KB × sepuluh kartu berarti beberapa megabita dari Sydney setiap muat feed. Ini prasyarat, bukan penyempurnaan.

---

## Tahapan

Disusun agar kamu bisa **berhenti di mana saja** dan tetap punya sesuatu yang utuh untuk didemokan.

### Tahap 0 — Pindah ke Vercel Blob (prasyarat) · ~½ hari

Buat Blob store di dashboard Vercel, pindahkan `updateAvatarAction` ke sana. Satu fungsi saja yang berubah, karena seluruh aplikasi hanya membaca URL dari `user.image`.

*Berhenti di sini: tidak ada fitur baru, tapi fondasinya benar dan foto profil jadi layak produksi.*

### Tahap 1 — Skema dan halaman posting · ~2 hari

- Tabel `outfit_posts` (id, userId, imageUrl, caption, status, createdAt)
- Tabel `outfit_post_items` (postId, productId) — maksimum 3 baris per pos
- `/post/new`: unggah foto, pilih barang dari katalog, kirim
- Foto dikecilkan di klien seperti avatar, tapi ke ukuran feed, bukan 256px

*Berhenti di sini: orang bisa memposting, tapi belum ada yang melihat.*

### Tahap 2 — Pos masuk ke feed · ~3–4 hari

Tahap terberat. `FeedItem` sebagai union, kartu pos di `swipe-feed.tsx`, dan swipe pada pos merekam sinyal untuk setiap barang yang ditandai.

Kartu pos menampilkan foto besar, nama dan avatar kreator, lalu strip barang yang ditandai di bawahnya — dari sanalah checkout dimulai.

*Berhenti di sini: fitur intinya hidup dan bisa didemokan.*

### Tahap 3 — Seed 8–10 pos contoh · ~1 hari

**Bukan pemanis, dan bukan dikerjakan belakangan.** Tanpa ini juri membuka feed dan tidak melihat satu pun pos orang — fitur andalanmu tidak terlihat sama sekali. Feed 12 produk kurasi lebih baik daripada feed berisi tiga foto asal.

Ditandai jelas sebagai data contoh, sama seperti katalog produkmu sekarang.

*Berhenti di sini: demonya sudah layak dinilai. Kalau waktu habis, ini garis finis yang aman.*

### Tahap 4 — Batas dan moderasi ringan · ~1–2 hari

- Maksimum 5 pos aktif per kreator. Tanpa ini, satu orang bisa membanjiri feed
- Status `pending` / `approved`
- Kreator bisa menghapus pos sendiri

### Tahap 5 — Verifikasi dan dokumentasi · ~1 hari

Test, build, telusur manual, README diperbarui — termasuk batasan yang diakui terbuka: barang terbatas pada katalog, moderasi manual tidak berskala, komisi belum ada.

**Total ± 9–11 hari kerja.** Sisa waktu adalah bantalan, dan kamu akan membutuhkannya.

---

## Risiko yang tersisa

- **Feed dua jenis konten bisa terasa berantakan.** Ini harus dicoba, bukan dipikirkan. Kalau kacau, alternatifnya tab terpisah — lebih aman, tapi kehilangan efek "orang sungguhan muncul di tengah belanja".
- **Kualitas foto pengguna tidak bisa dikendalikan.** Foto buruk merusak kesan aplikasi lebih cepat daripada foto bagus memperbaikinya.
- **Foto orang sungguhan di feed publik** membuka permukaan yang belum pernah kamu punya: ketelanjangan, foto orang lain yang diunggah tanpa izin, anak di bawah umur. Tahap 4 menahannya sementara, tapi tidak menyelesaikannya.
- **Ini menggandakan luas permukaan produk** tepat setelah kamu menambahkan akun. Risikonya jadwal, bukan teknis — dan risiko jadwal yang lebih sering membunuh proyek lomba.

---

## Untuk README, bukan untuk dibangun

Satu paragraf sebagai arah berikutnya:

> **Bagi hasil kreator.** Ketika sebuah pos menghasilkan pembelian, kreatornya mendapat bagian dari harga barang. Belum dibangun: pembayaran keluar memerlukan perjanjian brand, verifikasi identitas, dan penanganan pajak yang berada di luar cakupan proyek ini. Perhitungannya sendiri sudah bisa diturunkan dari data yang ada — setiap pesanan sudah tahu berasal dari pos yang mana.
