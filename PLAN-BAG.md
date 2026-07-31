# Rencana: Memisahkan いいね dari バッグ

Status: **rencana, belum dikerjakan**

## Keputusan yang sudah diambil

| Pertanyaan | Pilihan |
|---|---|
| Tombol ★ | Dihapus |
| Setelah swipe kanan | Tetap lewat lembar pilih ukuran |

---

## Bagaimana sekarang, dan kenapa membingungkan

| Aksi | Sekarang |
|---|---|
| Swipe kanan | Overlay マッチ → tombol「バッグに入れる」→ lembar ukuran → バッグ |
| Tombol いいね | **Sama persis dengan swipe kanan** |
| Tombol ★ | 一目惚れ |
| Swipe kiri / × | Lewat |

Dua masalahnya:

**Tombol いいね berbohong.** Namanya "suka", tapi yang dilakukannya adalah memulai pembelian. Orang menekannya karena mengira sedang menyimpan, lalu tiba-tiba diminta memilih ukuran.

**★ tidak terbaca sebagai apa pun.** Ikon bintang di sebelah tombol besar tidak menjelaskan bahwa ia menyimpan ke koleksi. Fitur 一目惚れ — salah satu bagian paling menarik dari aplikasi ini — praktis tersembunyi di balik ikon yang tidak dikenali.

---

## Bagaimana nanti

| Aksi | Hasil | Sinyal selera |
|---|---|---|
| Swipe kanan | Lembar pilih ukuran → **バッグ** | `like` |
| Tombol いいね | **一目惚れ** | `super` |
| Swipe kiri / × | Lewat | `pass` |
| Tombol ★ | *dihapus* | — |

Dua niat yang berbeda, dua tujuan yang berbeda: **geser untuk membeli, ketuk untuk menyimpan.**

Tombol menyusut dari tiga jadi dua, dan yang tersisa dua-duanya punya nama yang jujur.

---

## Kritik yang perlu kamu dengar sebelum setuju

**Ini melanggar satu kebiasaan yang cukup kuat.** Di hampir semua aplikasi bergaya swipe, tombol adalah *padanan* dari gestur — tombol hati sama dengan geser kanan. Di sini keduanya jadi berbeda, dan sebagian orang akan menekan いいね mengira itu jalan pintas dari swipe kanan.

**Akibat paling nyata: バッグ hanya bisa dicapai lewat gestur.** Tidak ada tombol yang membawamu ke sana. Untuk aplikasi yang memang mobile-only dan berporos pada swipe, itu bisa diterima — tapi bukan tanpa biaya, dan kamu sebaiknya tahu sebelum memutuskan.

**Peredamnya:** label. Selama tombolnya bertuliskan 一目惚れ, bukan いいね, tidak ada yang mengira ia sama dengan swipe kanan. Menamainya いいね sambil membuatnya berbeda dari swipe kanan justru mempertahankan kebohongan yang sedang kita perbaiki — hanya berpindah tempat.

**Karena itu saranku: ubah label tombolnya jadi「一目惚れ」atau「あとで見る」, bukan いいね.** Nama halaman tujuannya sudah 一目惚れ, jadi tombol dan halaman akhirnya sebut hal yang sama.

---

## Satu hal yang mudah terlewat: bobot selera jadi terbalik

Mesin selera memberi bobot begini:

| Arah | Bobot |
|---|---|
| `super` | +3 |
| `like` | +1 |
| `pass` | −1 |

Setelah perubahan ini, **`like` berarti "masuk バッグ"** dan **`super` berarti "disimpan ke 一目惚れ"**.

Artinya orang yang hampir membeli sesuatu memberi sinyal **+1**, sementara orang yang sekadar menyimpannya memberi **+3**. Terbalik. Niat membeli adalah sinyal selera terkuat yang bisa kamu punya, dan sekarang justru dihargai paling rendah.

**Perbaikannya cuma menukar dua angka di `lib/taste.ts`**, dan unit test-nya sudah ada sehingga ketahuan langsung kalau meleset:

```
super (一目惚れ) : +3 → +2
like  (バッグ)   : +1 → +3
```

Ini justru bagian favoritku dari perubahan ini: karena bobotnya hidup di modul murni yang teruji, mengubah arti sebuah aksi jadi soal mengubah satu tabel angka — bukan menyisir kode.

---

## Tahapan

### Tahap 1 — Tukar arti aksi di feed · ~½ hari

`components/swipe-feed.tsx`:

- `handleSwipeRight` → tetap merekam `like`, tapi **langsung membuka lembar ukuran**, tanpa overlay マッチ dulu
- `handleSuperLike` → dipanggil oleh tombol いいね, bukan ★
- `handleSuperLike` tetap merekam `super` dan memanggil `superLikeAction`

`components/product-card.tsx`:

- Tombol ★ dihapus
- Tombol besar diubah labelnya jadi「一目惚れ」dan memanggil `onSuperLike`
- Tata letak jadi dua tombol: × kecil di kiri, pil besar di kanan

### Tahap 2 — Rapikan overlay マッチ · ~½ hari

Overlay マッチ sekarang muncul untuk dua hal yang berbeda maknanya. Setelah Tahap 1:

- Swipe kanan tidak lagi memunculkan overlay — langsung ke lembar ukuran, satu ketukan lebih sedikit
- Tombol 一目惚れ tetap memunculkan overlay「Super Match」, karena di situlah momen menyenangkannya

Tombol「バッグに入れる」di dalam overlay ikut hilang, sebab overlay tidak lagi dipakai untuk pembelian.

### Tahap 3 — Tukar bobot mesin selera · ~1 jam

`lib/taste.ts`: `DIRECTION_WEIGHT` disesuaikan, unit test diperbarui agar menyatakan aturan barunya secara eksplisit — bukan sekadar diganti angkanya supaya lolos.

### Tahap 4 — Sinkronkan teks di seluruh aplikasi · ~½ hari

Beberapa tempat masih menyebut いいね dengan arti lama:

- `いいね！履歴` — sekarang isinya "yang pernah masuk バッグ"; namanya perlu dipikir ulang, mungkin jadi「気になる履歴」
- Statistik di マイページ berlabel いいね！
- Style DNA menyebut「選んだ」
- Empty state di 一目惚れ berbunyi「★ で特別な一着を保存」— ★ sudah tidak ada

### Tahap 5 — Verifikasi · ~½ hari

`npm test`, `npm run build`, lalu telusur manual: swipe kanan → ukuran → バッグ; ketuk 一目惚れ → koleksi; cek Style DNA berubah sesuai bobot baru.

**Total ± 2 hari kerja.**

---

## Risiko

**Nama halaman いいね！履歴 jadi salah** begitu いいね berarti 一目惚れ. Ini bukan bug, tapi akan membingungkan juri yang memperhatikan. Tahap 4 menanganinya, dan sebaiknya tidak dilewati.

**Data lama jadi campur aduk.** Swipe `like` yang sudah tersimpan dulu berarti "suka", sekarang berarti "masuk バッグ". Untuk demo lomba tidak masalah — tapi kalau kamu ingin bersih, hapus tabel `swipes` sekali sebelum penjurian.

**Menghapus ★ menghilangkan satu-satunya jalan ke 一目惚れ dari kartu** kalau labelnya salah. Pastikan Tahap 1 selesai utuh; setengah jadi berarti fitur itu tidak bisa dicapai sama sekali.
