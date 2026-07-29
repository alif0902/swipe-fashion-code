import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { listCategories, listProducts } from "@/lib/data";
import { cn } from "@/lib/utils";
import { categoryLabel, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "探す｜SwipeFash",
  description: "カテゴリーごとに、コレクション全体を。",
};

const tabClass = (active: boolean) =>
  cn(
    // uppercase & tracking-widest dilepas: keduanya tidak berpengaruh pada
    // kana/kanji tapi membuat spasi antar karakter Jepang jadi renggang aneh.
    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
    active
      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
      : "bg-card text-muted-foreground border border-border hover:border-primary/40",
  );

export default async function LookbookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ category, limit: 50 }),
  ]);

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <PageHeader
          icon={Search}
          eyebrow="COLLECTION"
          title="探す"
          subtitle="カテゴリーごとに、コレクション全体を。"
          count={products.length}
          countLabel="点"
        >
          {/* Tab kategori jadi anak header, bukan blok terpisah — supaya
              filter terbaca sebagai bagian dari judul halaman. */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 mt-5 px-6">
            <Link href="/lookbook" className={tabClass(!category)}>
              すべて
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/lookbook?category=${cat.slug}`}
                className={tabClass(category === cat.slug)}
              >
                {categoryLabel(cat.slug)}
              </Link>
            ))}
          </div>
        </PageHeader>

        <div className="px-4 pb-8 pt-2">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-muted">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 448px) 50vw, 224px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <div className="absolute top-2 right-2 bg-background text-foreground text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm">
                        New
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    {product.brand}
                  </p>
                  <h3 className="font-medium text-sm mb-1 leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="font-serif text-sm">
                    {formatPrice(product.price)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>このカテゴリーのアイテムはまだありません。</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
