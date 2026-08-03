import { AppLayout } from "@/components/layout";
import { SwipeFeed } from "@/components/swipe-feed";
import { listProducts } from "@/lib/data";
import { getOwnerId } from "@/lib/session";

// Stok, katalog, dan boost "Obsessed" berubah antar sesi/aksi, jadi feed
// tidak boleh di-cache statis saat build.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const sessionId = await getOwnerId();

  // getTasteProfile dulu diambil paralel di sini untuk memasok label penjelas
  // di atas kartu ("◯◯をよく選ぶから"). Label itu sudah dihapus, jadi query
  // keduanya ikut dilepas — satu perjalanan bolak-balik ke Sydney lebih sedikit
  // untuk tiap kali feed dibuka.
  //
  // Pengurutannya sendiri TIDAK berubah: rankByTaste di bawah tetap membaca
  // profil yang sama di sisi server. Yang hilang cuma penjelasannya di layar.
  const products = await listProducts({
    limit: 10,
    sessionId,
    rankByTaste: true,
  });

  return (
    <AppLayout>
      <SwipeFeed products={products} />
    </AppLayout>
  );
}
