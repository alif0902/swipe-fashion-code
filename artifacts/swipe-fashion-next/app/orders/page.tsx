import type { Metadata } from "next";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { OrderActions } from "@/components/order-actions";
import { OrderDeleteButton } from "@/components/order-delete-button";
import { listOrders } from "@/lib/data";
import { getCurrentUser, getOwnerId } from "@/lib/session";
import { getUserProfile } from "@/lib/profile";
import { formatAddress, formatPrice, safeImage } from "@/lib/format";

export const metadata: Metadata = {
  title: "バッグ｜HITOME",
  // Halaman personal — tidak ada gunanya di hasil pencarian.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Enum database berbahasa Inggris; yang dilihat pengguna tidak boleh begitu.
const statusLabel: Record<string, string> = {
  pending: "お支払い待ち",
  confirmed: "お支払い済み",
  shipped: "発送済み",
  delivered: "お届け済み",
  cancelled: "キャンセル済み",
};

const statusClass: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-green-500/10 text-green-500",
  shipped: "bg-blue-500/10 text-blue-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function OrdersPage() {
  const [sessionId, user] = await Promise.all([getOwnerId(), getCurrentUser()]);
  const [orders, stored] = await Promise.all([
    sessionId ? listOrders(sessionId) : Promise.resolve([]),
    user ? getUserProfile(user.id) : Promise.resolve(null),
  ]);

  // Alamat yang tersimpan mengisi langkah pengiriman di muka. Bagian-bagiannya
  // dirangkai jadi satu baris karena kolom `orders.shippingAddress` memang satu
  // teks — pesanan menyimpan alamat sebagaimana tertulis saat itu, dan tidak
  // boleh ikut berubah kalau profilnya disunting nanti.
  const shippingDefaults = stored
    ? {
        customerName: stored.name,
        customerEmail: stored.email,
        shippingAddress: formatAddress(stored),
      }
    : undefined;

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-28">
        <PageHeader
          icon={ShoppingBag}
          eyebrow="YOUR BAG"
          title="バッグ"
          subtitle="注文の確認とお支払いはこちらから。"
          count={orders.length}
          countLabel="件"
        />

        {orders.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <ShoppingBag className="w-9 h-9 text-muted-foreground" />
            </div>
            <h2 className="font-sans font-bold text-xl mb-2">まだ何もありません。</h2>
            <p className="text-muted-foreground max-w-[260px]">
              気になる一着を右にスワイプすると、ここに入ります。
            </p>
          </div>
        ) : (
          <div className="px-4 pb-8 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="relative bg-card border border-card-border rounded-2xl p-4 space-y-4"
              >
                {/* Hanya baris yang sudah dibatalkan yang bisa dibuang. Yang
                    masih aktif harus dibatalkan dulu agar stoknya kembali. */}
                {order.status === "cancelled" && (
                  <OrderDeleteButton orderId={order.id} />
                )}

                <div className="flex gap-4">
                  <div className="relative w-20 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={safeImage(order.product?.imageUrl)}
                      alt={order.product?.name ?? "商品"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  {/* Ruang di kanan hanya saat tombol hapus ada, supaya nama
                      produk yang panjang tidak berjalan di bawah ikonnya. */}
                  <div
                    className={`flex-1 min-w-0 ${
                      order.status === "cancelled" ? "pr-8" : ""
                    }`}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                      {order.product?.brand ?? "—"}
                    </p>
                    {/* Produk bisa lenyap dari katalog sementara pesanannya
                        tetap ada. Baris tanpa judul terbaca seperti data yang
                        gagal dimuat; kalimat ini menjelaskan apa yang terjadi. */}
                    <h3 className="font-sans font-bold text-base leading-snug mb-1 truncate">
                      {order.product?.name ?? "取り扱いが終了した商品"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      サイズ {order.selectedSize} · {order.selectedColor} ·{" "}
                      {order.quantity}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans font-bold text-lg text-primary">
                        {formatPrice(order.totalPrice)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          statusClass[order.status] ?? statusClass.pending
                        }`}
                      >
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <OrderActions
                  orderId={order.id}
                  status={order.status}
                  amount={order.totalPrice}
                  isSignedIn={Boolean(user)}
                  shippingDefaults={shippingDefaults}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
