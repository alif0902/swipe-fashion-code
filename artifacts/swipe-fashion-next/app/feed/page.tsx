import { cookies } from "next/headers";

import { AppLayout } from "@/components/layout";
import { FeedFilterFab } from "@/components/feed-filter-fab";
import { SwipeFeed } from "@/components/swipe-feed";
import { listCategories, listProducts } from "@/lib/data";
import {
  FEED_FILTER_COOKIE,
  countActiveFeedFilters,
  parseFeedFilter,
} from "@/lib/feed-filter";
import { getOwnerId } from "@/lib/session";

// Stok, katalog, dan boost "Obsessed" berubah antar sesi/aksi, jadi feed
// tidak boleh di-cache statis saat build.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const [sessionId, cookieStore] = await Promise.all([getOwnerId(), cookies()]);

  // Filter feed datang dari cookie, bukan query string: bilah navigasi menaut
  // ke `/feed` polos, jadi parameter di URL akan hilang tiap kali orang pindah
  // tab. Alasan lengkapnya di lib/feed-filter.ts.
  const filter = parseFeedFilter(cookieStore.get(FEED_FILTER_COOKIE)?.value);

  // getTasteProfile dulu diambil paralel di sini untuk memasok label penjelas
  // di atas kartu ("◯◯をよく選ぶから"). Label itu sudah dihapus, jadi query
  // keduanya ikut dilepas — satu perjalanan bolak-balik ke Sydney lebih sedikit
  // untuk tiap kali feed dibuka.
  //
  // Pengurutannya sendiri TIDAK berubah: rankByTaste di bawah tetap membaca
  // profil yang sama di sisi server. Yang hilang cuma penjelasannya di layar.
  //
  // Filter dan mesin selera tidak bertabrakan: filter adalah batas keras di
  // SQL, selera hanya menentukan urutan DI DALAM batas itu.
  //
  // listCategories ikut di Promise.all yang sama, jadi laci filter punya
  // daftar kategorinya tanpa menambah waktu tunggu.
  const [products, categories] = await Promise.all([
    listProducts({
      limit: 10,
      sessionId,
      rankByTaste: true,
      gender: filter.gender,
      category: filter.category,
    }),
    listCategories(),
  ]);

  return (
    <AppLayout
      overlay={<FeedFilterFab filter={filter} categories={categories} />}
    >
      {/* `key` yang berubah bersama filter, dan ini BUKAN kerapian.
          SwipeFeed membekukan deknya saat dipasang — itu yang melindungi kartu
          yang sedang dilihat dari perubahan props di tengah jalan. Tanpa key
          ini, mengganti filter tidak akan mengubah apa pun di layar: propsnya
          baru, deknya tetap yang lama. Key baru berarti komponennya dipasang
          ulang, dek dibekukan dari daftar yang baru, dan hitungannya kembali
          ke kartu pertama. */}
      <SwipeFeed
        key={`${filter.gender ?? ""}-${filter.category ?? ""}`}
        products={products}
        isFiltered={countActiveFeedFilters(filter) > 0}
      />
    </AppLayout>
  );
}
