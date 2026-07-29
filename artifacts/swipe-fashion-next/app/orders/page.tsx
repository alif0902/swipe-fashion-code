import type { Metadata } from "next";

import { AppLayout } from "@/components/layout";
import { OrderActions } from "@/components/order-actions";
import { listOrders } from "@/lib/data";
import { getSessionId } from "@/lib/session";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "バッグ｜SwipeFash",
  // Halaman personal — tidak ada gunanya di hasil pencarian.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const statusClass: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-green-500/10 text-green-500",
  shipped: "bg-blue-500/10 text-blue-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function OrdersPage() {
  const sessionId = await getSessionId();
  const orders = sessionId ? await listOrders(sessionId) : [];

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <header className="px-6 pt-10 pb-6">
          <h1 className="font-serif text-4xl">バッグ</h1>
        </header>

        {orders.length === 0 ? (
          <div className="text-center py-20 px-8 text-muted-foreground">
            <p className="font-serif text-2xl mb-2 text-foreground">
              まだ何もありません。
            </p>
            <p className="text-sm">
              気になる一着を右にスワイプすると、ここに入ります。
            </p>
          </div>
        ) : (
          <div className="px-4 pb-8 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card border border-card-border rounded-2xl p-4 space-y-4"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.product?.imageUrl ?? ""}
                    alt={order.product?.name ?? "Product"}
                    className="w-20 h-24 object-cover rounded-md bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                      {order.product?.brand}
                    </p>
                    <h3 className="font-serif text-lg leading-snug mb-1 truncate">
                      {order.product?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Size {order.selectedSize} · {order.selectedColor} ·{" "}
                      {order.quantity}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-lg">
                        {formatPrice(order.totalPrice)}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${
                          statusClass[order.status] ?? statusClass.pending
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <OrderActions orderId={order.id} status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
