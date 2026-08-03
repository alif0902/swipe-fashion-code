# Audit keamanan & potensi bug — swipe-fashion

Ditinjau: 3 Agustus 2026. Cakupan: `artifacts/swipe-fashion-next` (app, lib,
components, middleware), `lib/db`, dan `scripts`.

Tidak ada kerentanan yang bisa dipakai orang luar untuk mengambil alih akun atau
membaca data orang lain. Temuan terberat semuanya ada di **logika pesanan**, dan
ketiganya berujung pada hal yang sama: stok dan status pesanan diubah lewat
baca-lalu-tulis yang tidak atomik dan tidak dibungkus transaksi.

---

## Ringkasan

| # | Temuan | Tingkat | Status |
|---|--------|---------|--------|
| 1 | Pesanan bersamaan bisa menjual stok melebihi yang ada | **Tinggi** | ✅ Diperbaiki |
| 2 | Pesanan yang sudah dibatalkan bisa dikonfirmasi ulang | **Tinggi** | ✅ Diperbaiki |
| 3 | Pembatalan ganda menggandakan pengembalian stok | **Sedang** | ✅ Diperbaiki |
| 4 | Tidak ada header keamanan HTTP | Sedang | ⬜ Belum |
| 5 | Tidak ada pembatasan laju di server action mana pun | Sedang | ⬜ Belum |
| 6 | Tipe MIME dipercaya dari string, bukan dari isi berkas | Rendah | ⬜ Belum |
| 7 | Tidak ada CHECK constraint `stock >= 0` di database | Rendah | ✅ Ditambahkan — **butuh `npm run db:push`** |
| 8 | `quantity` tanpa batas atas | Rendah | ✅ Diperbaiki (`.max(99)`) |
| 9 | Ukuran/warna tidak divalidasi terhadap produknya | Rendah | ✅ Diperbaiki |
| 10 | `explainRanking` jadi kode mati | Informasi | ⬜ Dibiarkan |

> **Belum aktif sampai di-push.** Temuan #7 mengubah skema. Constraint-nya baru
> berlaku setelah `npm run db:push`, dan push akan **gagal kalau sudah ada baris
> dengan stok negatif** — bereskan dulu barisnya kalau itu terjadi.

---

## 1. Pesanan bersamaan bisa menjual stok melebihi yang ada — Tinggi

`createOrderAction` membaca stok, memeriksanya, lalu menuliskan **nilai mutlak**
yang dihitung dari hasil baca tadi:

```ts
const [product] = await db.select()...            // baca: stock = 1
if (product.stock < quantity) return ...          // lolos
await db.insert(ordersTable).values({...})        // pesanan dibuat
await db.update(productsTable)
  .set({ stock: product.stock - quantity })       // tulis: 1 - 1 = 0
```

Dua request yang datang bersamaan sama-sama membaca `stock = 1`, sama-sama lolos
pemeriksaan, dan sama-sama menulis `0`. Hasilnya dua pesanan terjual dari satu
barang. Tidak ada transaksi, jadi kalau `insert` berhasil tapi `update` gagal,
pesanan tetap ada sementara stok tidak pernah berkurang.

Yang membuat ini menonjol: `cancelOrderAction` di berkas yang sama **sudah**
memakai pola yang benar — `sql\`${stock} + ${quantity}\`` yang dihitung database.
Pola itu tinggal diterapkan ke arah sebaliknya.

**Perbaikan.** Jadikan pengurangan stok sebagai satu perintah atomik yang
sekaligus menjadi penjaganya, dan bungkus bersama pembuatan pesanan:

```ts
await db.transaction(async (tx) => {
  const claimed = await tx
    .update(productsTable)
    .set({ stock: sql`${productsTable.stock} - ${quantity}` })
    .where(and(
      eq(productsTable.id, productId),
      gte(productsTable.stock, quantity),      // penjaga ikut ke dalam WHERE
    ))
    .returning({ id: productsTable.id });

  if (claimed.length === 0) throw new OutOfStockError();

  await tx.insert(ordersTable).values({ ... });
});
```

Kuncinya syarat `stock >= quantity` pindah ke `WHERE`. Postgres mengunci baris
saat UPDATE, jadi request kedua menunggu, membaca nilai yang sudah diperbarui,
dan tidak cocok lagi — `claimed` kosong dan pesanannya ditolak.

## 2. Pesanan yang sudah dibatalkan bisa dikonfirmasi ulang — Tinggi

`confirmOrderAction` memeriksa kepemilikan, tapi **tidak memeriksa status**:

```ts
if (!existing || existing.sessionId !== sessionId) return ...  // hanya ini
await db.update(ordersTable).set({ status: "confirmed", paymentStatus: "paid", ... })
```

Urutannya: batalkan pesanan → stok dikembalikan → panggil `confirmOrderAction`
untuk id yang sama → pesanan jadi `confirmed` dan `paid`, sementara stoknya sudah
telanjur dikembalikan. Barang terkonfirmasi tanpa stok terpotong.

Ini bisa dilakukan siapa pun atas pesanannya sendiri, cukup lewat pemanggilan
server action langsung — tidak perlu menembus UI.

**Perbaikan.** Tambahkan penjaga status, dan taruh di `WHERE` supaya sekaligus
tahan balapan:

```ts
const updated = await db.update(ordersTable)
  .set({ status: "confirmed", ... })
  .where(and(
    eq(ordersTable.id, orderId),
    eq(ordersTable.sessionId, sessionId),
    eq(ordersTable.status, "pending"),        // hanya dari pending
  ))
  .returning({ id: ordersTable.id });

if (updated.length === 0) return { ok: false, error: "..." };
```

## 3. Pembatalan ganda menggandakan pengembalian stok — Sedang

Di `cancelOrderAction`, penjaganya terpisah dari penulisannya:

```ts
if (existing.status !== "cancelled") {
  await db.update(productsTable).set({ stock: sql`... + ${existing.quantity}` })
}
await db.update(ordersTable).set({ status: "cancelled", ... })
```

Increment stoknya memang atomik, tapi pemeriksaan `status !== "cancelled"`
dibaca dari snapshot sebelumnya. Dua pembatalan bersamaan atas pesanan yang sama
sama-sama lolos, dan stok bertambah dua kali lipat dari yang seharusnya.

**Perbaikan.** Sama seperti #2 — pindahkan syarat status ke `WHERE` pada update
pesanan, kembalikan barisnya, dan **hanya** kembalikan stok kalau benar-benar ada
baris yang berubah. Bungkus keduanya dalam satu transaksi.

## 4. Tidak ada header keamanan HTTP — Sedang

`next.config.ts` hanya mengatur `images.remotePatterns`. Tidak ada
`Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, maupun
`Strict-Transport-Security`. Tanpa `X-Frame-Options`/`frame-ancestors`, halaman
bisa dibingkai situs lain — dan aplikasi yang interaksinya berbasis gestur
sentuh justru relatif rentan pada clickjacking.

**Perbaikan.** Tambahkan blok `headers()` di `next.config.ts`. CSP butuh
penyetelan karena Next menyuntik skrip inline, jadi mulai dari
`Content-Security-Policy-Report-Only` sebelum ditegakkan.

## 5. Tidak ada pembatasan laju — Sedang

Tidak ada pembatasan di server action mana pun. Yang paling terasa:
`recordSwipeAction` dan `superLikeAction` bisa dipanggil berulang tanpa henti
untuk menggelembungkan tabel, dan `createOrderAction` bisa dipakai menghabiskan
stok tanpa pernah membayar. Endpoint autentikasi better-auth juga tidak dilapisi
pembatas percobaan masuk.

**Perbaikan.** Untuk skala saat ini, pembatas sederhana berbasis `sessionId` di
`createOrderAction` dan endpoint auth sudah menutup risiko terbesar.

## 6. Tipe MIME dipercaya dari string — Rendah

`putDataUrl` mengambil MIME dari teks data URL, lalu menyimpan berkasnya dengan
`contentType` itu, tanpa memeriksa isi berkasnya benar-benar gambar. Kiriman
`data:image/png;base64,<isi apa pun>` akan lolos.

Dampaknya terbatas: berkas disajikan dari `*.public.blob.vercel-storage.com`
yang beda origin dari aplikasi, dan SVG sudah ditolak — jadi tidak ada jalur XSS
langsung. Ini catatan pertahanan berlapis, bukan lubang aktif.

**Perbaikan.** Periksa magic bytes: PNG `89 50 4E 47`, JPEG `FF D8 FF`, WebP
`RIFF....WEBP`.

## 7. Tidak ada CHECK constraint stok — Rendah

`stock: integer("stock").notNull().default(0)` tanpa `CHECK (stock >= 0)`.
Aplikasi adalah satu-satunya penjaga, jadi bug #1 bisa membuat stok negatif tanpa
ada yang menahan di lapis database.

Setelah #1 diperbaiki, tambahkan constraint ini sebagai jaring pengaman.

## 8. `quantity` tanpa batas atas — Rendah

`z.number().int().min(1)` tanpa `.max()`. Saat ini tertahan pemeriksaan stok,
jadi tidak bisa dieksploitasi — tapi batas atas seperti `.max(99)` murah dan
menutup celah kalau pemeriksaan stok berubah di kemudian hari.

## 9. Ukuran dan warna tidak divalidasi — Rendah

`selectedSize` dan `selectedColor` hanya divalidasi sebagai string tidak kosong,
tidak pernah dicocokkan dengan `product.sizes` dan `product.colors`. Pesanan
untuk ukuran yang tidak diproduksi bisa masuk ke database dan baru ketahuan saat
pemenuhan pesanan.

**Perbaikan.** Setelah produk diambil di `createOrderAction`, periksa
`product.sizes.includes(selectedSize)` dan hal serupa untuk warna.

## 10. `explainRanking` jadi kode mati — Informasi

Label penjelas di feed sudah dihapus, jadi `lib/taste.ts:233` tidak lagi
dipanggil dari mana pun. Empat test-nya di `lib/taste.test.ts` masih lulus dan
tetap menjaga fungsinya. Dibiarkan supaya mudah dipakai lagi di スタイルDNA;
hapus kalau memang tidak akan dipakai.

---

## Yang sudah benar

Bagian ini ditulis supaya tidak tanpa sengaja dibongkar saat memperbaiki yang di
atas.

- **Otorisasi admin.** Kelima aksi di `app/admin/actions.ts` memanggil
  `requireAdmin()` di baris pertama, bukan mengandalkan layout — layout memang
  tidak pernah berjalan saat server action dipanggil langsung.
- **Peran dibaca segar dari database.** `readRole()` sengaja tidak memakai
  `role` dari sesi ter-cache, jadi pencabutan hak admin langsung berlaku.
- **Pemeriksaan kepemilikan.** `confirmOrder`, `cancelOrder`, dan `deleteOrder`
  semuanya membandingkan `existing.sessionId !== sessionId`. Tidak ada IDOR.
- **Middleware jujur soal perannya.** Ditandai eksplisit sebagai kenyamanan,
  bukan pengaman, dengan alasan yang tepat: edge runtime tidak bisa membaca
  database.
- **SVG ditolak saat unggah**, dengan alasan yang benar — SVG bisa memuat skrip.
- **`claimAnonymousData` transaksional** dan menangani tabrakan unique constraint
  secara deterministik.
- **Tidak ada `dangerouslySetInnerHTML`** di seluruh basis kode.
- **Tidak ada SQL mentah yang menyisipkan input pengguna.** Satu-satunya
  pemakaian `sql` adalah increment stok, dan itu ter-parameterisasi.
- **`.env.local` tidak pernah masuk git**, dan tidak ada jejaknya di riwayat.

---

## Catatan pengujian

Perbaikan #1–#3 memindahkan invariannya ke dalam SQL — syarat stok dan status
kini hidup di klausa `WHERE`, ditegakkan Postgres lewat penguncian baris. Itu
tempat yang benar untuknya, tapi konsekuensinya **tidak ada lagi fungsi murni
yang bisa diuji lewat unit test**: yang menjamin kebenarannya adalah database.

Kondisi pengujian proyek saat ini:

- `vitest.config.ts` hanya menyertakan `lib/**/*.test.ts`. `app/actions.ts`
  tidak pernah tercakup.
- Tidak ada mock database, testcontainers, maupun database uji.

Jadi membuktikan #1–#3 butuh Postgres sungguhan. Yang **sudah** ditambahkan dan
bisa langsung dijalankan adalah test aturan validasi di `lib/validation.test.ts`
(batas atas quantity, penolakan pecahan).

Untuk memverifikasi #1 secara manual terhadap database asli:

```sql
-- sisakan satu barang
UPDATE products SET stock = 1 WHERE id = <id>;
```

Lalu picu dua `createOrderAction` bersamaan untuk produk itu. Yang benar: satu
berhasil, satu mengembalikan 在庫が足りません, dan `stock` berakhir di 0 — bukan
di -1, dan bukan dua pesanan.

Kalau mau ditegakkan otomatis, langkahnya: perluas `include` vitest ke `app/**`,
lalu jalankan Postgres uji lewat testcontainers.

## Sisa pekerjaan

1. **`npm run db:push`** untuk mengaktifkan CHECK constraint #7.
2. **#4 dan #5** — header keamanan dan pembatasan laju. Tidak bergantung pada
   yang lain.
3. **#6** — periksa magic bytes saat unggah.
4. **#10** — putuskan `explainRanking` dipakai lagi atau dihapus.
