import Image from "next/image";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, productsTable } from "@workspace/db";

import { requireAdmin } from "@/lib/session";
import { formatPrice, categoryLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();

  // Terbaru dulu: yang paling mungkin ingin disunting adalah yang baru
  // ditambahkan, bukan yang paling lama ada.
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-2xl">商品</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length}点を登録中
          </p>
        </div>

        <Button asChild className="h-11 px-6 rounded-full font-bold">
          <Link href="/admin/products/new" data-testid="link-new-product">
            <Plus className="w-4 h-4 mr-1.5" />
            商品を追加
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left font-medium px-5 py-3">商品</th>
              <th className="text-left font-medium px-3 py-3">カテゴリー</th>
              <th className="text-right font-medium px-3 py-3">価格</th>
              <th className="text-right font-medium px-3 py-3">在庫</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              // Tabel tanpa baris hanya menampilkan header, dan itu terbaca
              // seperti data yang gagal dimuat.
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-14 text-center text-sm text-muted-foreground"
                >
                  商品がありません。「商品を追加」から登録してください。
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="relative w-10 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={product.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {product.brand}
                      </span>
                      <span className="block font-medium truncate">
                        {product.name}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {categoryLabel(product.category)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatPrice(parseFloat(product.price))}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {product.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
