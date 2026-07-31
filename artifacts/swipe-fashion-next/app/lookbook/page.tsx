import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mars, Search, Users, Venus } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { FilterFab } from "@/components/filter-fab";
import { listCategories, listProducts, type ProductSort } from "@/lib/data";
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

// Query string jadi satu-satunya sumber kebenaran filter, bukan state React:
// hasilnya bisa di-bookmark, tombol back bekerja, dan daftarnya tetap dirender
// di server.
const GENDERS = [
  { value: "women", label: "レディース", icon: Venus },
  { value: "men", label: "メンズ", icon: Mars },
] as const;

// Membangun URL dengan mempertahankan filter lain yang sedang aktif — mengganti
// gender tidak boleh diam-diam menghapus pilihan 並び替え.
function buildHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | null>,
) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v) next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `/lookbook?${qs}` : "/lookbook";
}

const segClass = (active: boolean) =>
  cn(
    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all",
    active
      ? "bg-card text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
  );

export default async function LookbookPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    gender?: string;
    sort?: string;
    stock?: string;
  }>;
}) {
  const sp = await searchParams;
  const { category, sort, stock } = sp;
  const gender = sp.gender === "men" || sp.gender === "women" ? sp.gender : undefined;

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({
      category,
      gender,
      sort: (sort as ProductSort) ?? "new",
      inStockOnly: stock === "1",
      limit: 50,
    }),
  ]);

  return (
    <AppLayout>
      <div className="relative min-h-full bg-background pb-28">
        <PageHeader
          icon={Search}
          eyebrow="COLLECTION"
          title="探す"
          subtitle="カテゴリーごとに、コレクション全体を。"
          count={products.length}
          countLabel="点"
        >
          {/* Dua tingkat filter, sesuai urutan cara orang mempersempit
              pilihan: dulu siapa yang memakainya, baru jenis barangnya. */}
          <div className="mt-5 px-6">
            <div className="flex gap-1 p-1 rounded-full bg-muted/70">
              <Link
                href={buildHref(sp, { gender: null })}
                className={segClass(!gender)}
              >
                <Users className="w-4 h-4" />
                すべて
              </Link>
              {GENDERS.map((g) => {
                const Icon = g.icon;
                const active = gender === g.value;
                return (
                  <Link
                    key={g.value}
                    href={buildHref(sp, { gender: g.value })}
                    className={segClass(active)}
                  >
                    {/* Ikon diberi warna khas gendernya hanya saat aktif.
                        Kalau selalu berwarna, ketiganya bersaing menarik
                        perhatian dan justru tidak jelas mana yang terpilih. */}
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        active &&
                          (g.value === "men" ? "text-sky-500" : "text-pink-500"),
                      )}
                    />
                    {g.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-2 mt-3 px-6">
            <Link
              href={buildHref(sp, { category: null })}
              className={tabClass(!category)}
            >
              すべて
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildHref(sp, { category: cat.slug })}
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
              <p>条件に合うアイテムはまだありません。</p>
            </div>
          )}
        </div>

        <FilterFab params={sp} resultCount={products.length} />
      </div>
    </AppLayout>
  );
}
