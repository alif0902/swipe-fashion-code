import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db, ordersTable, productsTable } from "@workspace/db";

import { requireAdmin } from "@/lib/session";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [[product], [orderRow]] = await Promise.all([
    db.select().from(productsTable).where(eq(productsTable.id, productId)),
    db
      .select({ n: count() })
      .from(ordersTable)
      .where(eq(ordersTable.productId, productId)),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
        商品一覧
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="font-sans font-bold text-2xl">{product.name}</h1>
      </div>

      <ProductForm
        productId={product.id}
        orderCount={Number(orderRow?.n ?? 0)}
        initial={{
          name: product.name,
          brand: product.brand,
          price: String(parseFloat(product.price)),
          originalPrice: product.originalPrice
            ? String(parseFloat(product.originalPrice))
            : "",
          description: product.description,
          images:
            product.images.length > 0 ? product.images : [product.imageUrl],
          category: product.category,
          gender: product.gender,
          sizes: product.sizes.join(", "),
          colors: product.colors.join(", "),
          material: product.material ?? "",
          feel: product.feel ?? "",
          dimensions: Object.entries(product.dimensions ?? {}).map(
            ([key, value]) => ({ key, value }),
          ),
          stock: String(product.stock),
          isNew: product.isNew,
          isSale: product.isSale,
        }}
      />
    </div>
  );
}
