"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Plus, Star, Trash2, X } from "lucide-react";

import {
  createProductAction,
  setProductArchivedAction,
  updateProductAction,
  uploadProductImageAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductCard } from "@/components/product-card";
import { useToast } from "@/hooks/use-toast";
import type { AppProduct } from "@/lib/format";
import {
  DIMENSION_PRESETS,
  SIZE_PRESETS,
  productSchema,
  type ProductInput,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "tops", label: "トップス" },
  { value: "bottoms", label: "ボトムス" },
  { value: "outerwear", label: "アウター" },
  { value: "dresses", label: "ワンピース" },
];

const FEED_WIDTH = 1080;

// Foto dikecilkan di browser, sama seperti avatar — hanya targetnya lebar feed,
// bukan 256px persegi. Rasio aslinya dipertahankan: memaksa foto produk jadi
// persegi memotong sepatu atau kepala model.
function shrinkToWidth(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, FEED_WIDTH / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };

    image.src = url;
  });
}

type FormState = {
  name: string;
  brand: string;
  price: string;
  originalPrice: string;
  description: string;
  images: string[];
  category: string;
  gender: "women" | "men";
  sizes: string;
  colors: string;
  material: string;
  dimensions: { key: string; value: string }[];
  stock: string;
  isNew: boolean;
  isSale: boolean;
};

const EMPTY: FormState = {
  name: "",
  brand: "",
  price: "",
  originalPrice: "",
  description: "",
  images: [],
  category: "",
  gender: "women",
  sizes: "",
  colors: "",
  material: "",
  dimensions: [],
  stock: "10",
  isNew: true,
  isSale: false,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ProductForm({
  productId,
  initial,
  isArchived = false,
  orderCount = 0,
}: {
  productId?: number;
  initial?: FormState;
  isArchived?: boolean;
  orderCount?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(initial ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  // Memilih kategori mengisi kunci ukuran dan pilihan size otomatis. Tanpa ini
  // admin harus mengarang sendiri nama kolom seperti 着丈 setiap kali, dan satu
  // salah ketik membuat tabel 基本情報 di kartu feed tampil tidak konsisten.
  const chooseCategory = (value: string) => {
    const keys = DIMENSION_PRESETS[value] ?? [];
    const hasFilled = form.dimensions.some((d) => d.value.trim() !== "");

    setForm((prev) => ({
      ...prev,
      category: value,
      // Yang sudah diisi tidak ditimpa — admin yang sedang menyunting produk
      // lama tidak boleh kehilangan angkanya karena mengganti kategori.
      dimensions: hasFilled
        ? prev.dimensions
        : keys.map((key) => ({ key, value: "" })),
      sizes: prev.sizes.trim() === "" ? (SIZE_PRESETS[value] ?? []).join(", ") : prev.sizes,
    }));
  };

  const addPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files.slice(0, 6 - form.images.length)) {
        const dataUrl = await shrinkToWidth(file);
        const result = await uploadProductImageAction(dataUrl);

        if (!result.ok) {
          toast({ title: result.error, variant: "destructive" });
          break;
        }
        setForm((prev) => ({ ...prev, images: [...prev.images, result.data!] }));
      }
    } catch {
      toast({ title: "画像を読み込めませんでした", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toPayload = (): ProductInput => ({
    name: form.name.trim(),
    brand: form.brand.trim(),
    price: Number(form.price) || 0,
    originalPrice: form.originalPrice.trim() === "" ? null : Number(form.originalPrice),
    description: form.description.trim(),
    images: form.images,
    category: form.category,
    gender: form.gender,
    sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
    material: form.material.trim() === "" ? null : form.material.trim(),
    dimensions: Object.fromEntries(
      form.dimensions
        .filter((d) => d.key.trim() !== "" && d.value.trim() !== "")
        .map((d) => [d.key.trim(), d.value.trim()]),
    ),
    stock: Number(form.stock) || 0,
    isNew: form.isNew,
    isSale: form.isSale,
  });

  // Pratinjau memakai komponen ProductCard yang SAMA PERSIS dengan feed —
  // bukan tiruan. Kalau kartu asli berubah, pratinjau ikut berubah, dan tidak
  // ada kemungkinan keduanya berbeda diam-diam.
  const preview = useMemo<AppProduct>(() => {
    const payload = toPayload();
    return {
      id: productId ?? 0,
      ...payload,
      images: payload.images.length > 0 ? payload.images : ["/assets/coat-camel.jpg"],
      imageUrl: payload.images[0] ?? "/assets/coat-camel.jpg",
      name: payload.name || "商品名",
      brand: payload.brand || "ブランド",
      description: payload.description || "商品説明がここに入ります。",
      category: payload.category || "tops",
      rating: null,
      reviewCount: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, productId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = toPayload();
    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSaving(true);
    const result = productId
      ? await updateProductAction(productId, parsed.data)
      : await createProductAction(parsed.data);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast({ title: productId ? "保存しました" : "商品を追加しました" });
    router.push("/admin/products");
    router.refresh();
  };

  const toggleArchive = async () => {
    if (!productId) return;
    setSaving(true);
    const result = await setProductArchivedAction(productId, !isArchived);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast({ title: isArchived ? "公開しました" : "アーカイブしました" });
    router.refresh();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
      <form onSubmit={submit} className="space-y-8">
        {/* ---- Foto ---- */}
        <section className="rounded-2xl border border-border bg-background p-5 space-y-4">
          <div>
            <h2 className="font-sans font-bold">写真</h2>
            <p className="text-xs text-muted-foreground mt-1">
              1枚目がフィードのメイン写真になります。最大6枚。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {form.images.map((src, i) => (
              <div key={src} className="relative w-24 h-32 rounded-xl overflow-hidden bg-muted group">
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />

                {i === 0 && (
                  <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    メイン
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    set({ images: form.images.filter((_, j) => j !== i) })
                  }
                  aria-label="この写真を削除"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...form.images];
                      [next[0], next[i]] = [next[i], next[0]];
                      set({ images: next });
                    }}
                    className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    メインにする
                  </button>
                )}
              </div>
            ))}

            {form.images.length < 6 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                data-testid="button-add-photo"
                className="w-24 h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px]">追加</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={addPhotos}
            className="hidden"
          />
        </section>

        {/* ---- Dasar ---- */}
        <section className="rounded-2xl border border-border bg-background p-5 space-y-4">
          <h2 className="font-sans font-bold">基本情報</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="商品名">
              <Input
                data-testid="input-product-name"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="ブランド">
              <Input
                data-testid="input-product-brand"
                value={form.brand}
                onChange={(e) => set({ brand: e.target.value })}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>

          <Field label="カテゴリー">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => chooseCategory(c.value)}
                  className={cn(
                    "h-10 px-4 rounded-full text-sm font-medium border transition",
                    form.category === c.value
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="性別">
            <div className="flex gap-2">
              {(["women", "men"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set({ gender: g })}
                  className={cn(
                    "h-10 px-5 rounded-full text-sm font-medium border transition",
                    form.gender === g
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {g === "women" ? "レディース" : "メンズ"}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="販売価格">
              <Input
                data-testid="input-product-price"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="参考価格" hint="セール表示に使います">
              <Input
                inputMode="numeric"
                value={form.originalPrice}
                onChange={(e) => set({ originalPrice: e.target.value })}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="在庫">
              <Input
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => set({ stock: e.target.value })}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>

          <Field label="商品説明">
            <textarea
              data-testid="input-product-description"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-y"
            />
          </Field>
        </section>

        {/* ---- Detail ---- */}
        <section className="rounded-2xl border border-border bg-background p-5 space-y-4">
          <h2 className="font-sans font-bold">詳細</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="サイズ展開" hint="カンマ区切り">
              <Input
                value={form.sizes}
                onChange={(e) => set({ sizes: e.target.value })}
                placeholder="S, M, L"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="カラー" hint="カンマ区切り">
              <Input
                value={form.colors}
                onChange={(e) => set({ colors: e.target.value })}
                placeholder="Black, Camel"
                className="h-11 rounded-xl"
              />
            </Field>
          </div>

          <Field label="素材">
            <Input
              value={form.material}
              onChange={(e) => set({ material: e.target.value })}
              placeholder="ウール80% / カシミヤ20%"
              className="h-11 rounded-xl"
            />
          </Field>

          <Field label="採寸" hint="カテゴリーを選ぶと項目が入ります">
            <div className="space-y-2">
              {form.dimensions.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={row.key}
                    onChange={(e) => {
                      const next = [...form.dimensions];
                      next[i] = { ...next[i], key: e.target.value };
                      set({ dimensions: next });
                    }}
                    placeholder="着丈"
                    className="h-11 rounded-xl w-32 shrink-0"
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => {
                      const next = [...form.dimensions];
                      next[i] = { ...next[i], value: e.target.value };
                      set({ dimensions: next });
                    }}
                    placeholder="68cm"
                    className="h-11 rounded-xl flex-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set({ dimensions: form.dimensions.filter((_, j) => j !== i) })
                    }
                    aria-label="この項目を削除"
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  set({ dimensions: [...form.dimensions, { key: "", value: "" }] })
                }
                className="text-xs font-bold text-primary h-9 px-3 rounded-full hover:bg-primary/10 transition"
              >
                + 項目を追加
              </button>
            </div>
          </Field>

          <div className="flex gap-2 pt-1">
            {([
              ["isNew", "NEW"],
              ["isSale", "SALE"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => set({ [key]: !form[key] } as Partial<FormState>)}
                className={cn(
                  "h-10 px-5 rounded-full text-sm font-bold border transition",
                  form[key]
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "border-border text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={saving || uploading}
            data-testid="button-save-product"
            className="h-12 px-8 rounded-full font-bold"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {productId ? "保存する" : "商品を追加"}
          </Button>

          {productId && (
            <Button
              type="button"
              variant="ghost"
              onClick={toggleArchive}
              disabled={saving}
              className="h-12 px-6 rounded-full text-muted-foreground"
            >
              {isArchived ? "公開に戻す" : "アーカイブ"}
            </Button>
          )}

          {productId && orderCount > 0 && !isArchived && (
            // Alasan tidak ada tombol hapus, dijelaskan di tempat orang
            // mencarinya — bukan disembunyikan di dokumentasi.
            <p className="text-xs text-muted-foreground">
              この商品には{orderCount}件の注文があります。削除ではなくアーカイブされます。
            </p>
          )}
        </div>
      </form>

      {/* ---- Pratinjau ---- */}
      <aside className="lg:sticky lg:top-8 space-y-3">
        <p className="text-xs font-bold text-muted-foreground">
          フィードでの見え方
        </p>
        <div className="relative w-full max-w-[400px] aspect-[9/16] rounded-[2rem] overflow-hidden border border-border bg-background shadow-sm">
          <ProductCard
            product={preview}
            onSwipeRight={() => {}}
            onSwipeLeft={() => {}}
            onSuperLike={() => {}}
            isFront={false}
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          実際のフィードと同じ部品で描画しています。入力するとその場で反映されます。
        </p>
      </aside>
    </div>
  );
}

export type { FormState as ProductFormState };
