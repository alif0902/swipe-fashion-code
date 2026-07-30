import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
        商品一覧
      </Link>

      <h1 className="font-sans font-bold text-2xl">商品を追加</h1>

      <ProductForm />
    </div>
  );
}
