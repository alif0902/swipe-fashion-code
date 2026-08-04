"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { createOrderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, type AppProduct } from "@/lib/format";
import { sizeChartFor } from "@/lib/size-chart";
import { cn } from "@/lib/utils";

interface OrderSheetProps {
  product: AppProduct | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Dipanggil setelah pesanan berhasil dibuat.
   *
   * Ada supaya pemanggil bisa menentukan apa yang terjadi sesudahnya — tetap
   * di halaman, atau langsung menuju バッグ untuk membayar. Lembar ini sendiri
   * tidak tahu (dan tidak perlu tahu) niat penggunanya.
   */
  onAdded?: () => void;
}

/**
 * Nama warna katalog → hex untuk swatch.
 *
 * Nilai untuk warna yang benar-benar dipakai katalog DIAMBIL DARI FOTO
 * PRODUKNYA, bukan dikarang. Versi sebelumnya memakai primer mentah
 * (#ff0000, #0000ff) yang tidak pernah menyerupai garmen mana pun — merah
 * murni untuk gaun merah anggur terbaca seperti produk yang berbeda.
 *
 * Peta lama juga TIDAK punya Burgundy dan Camel. Karena fallback-nya
 * `color.toLowerCase()` dan CSS tidak mengenal `burgundy` maupun `camel`,
 * browser mengabaikan nilainya dan swatch-nya jadi kosong — inilah sebabnya
 * gaun cokelat anggur tampil dengan lingkaran putih.
 */
const colorMap: Record<string, string> = {
  // --- diambil dari foto produk di katalog ---
  Indigo: "#344e6c", // ワイドデニムパンツ
  Camel: "#98704e", // タックワイドチノ
  Burgundy: "#513232", // ノースリーブミディワンピース
  Red: "#9d1f2b", // gaun floral & raglan T
  Coral: "#e16862", // コーラルブルゾン
  Black: "#1f1e22", // ヘビーウェイトパーカ — hitam kain, bukan #000
  Navy: "#232d4d", // ネイビーテーラードジャケット
  Pink: "#eaa9a5", // コットンポロシャツ
  Grey: "#a2afb3", // コットンポロシャツ
  Teal: "#66a1a8", // コットンポロシャツ

  // --- belum dipakai, disiapkan untuk produk yang ditambah lewat admin ---
  White: "#f4f2ee",
  Beige: "#e8dfd0",
  Brown: "#7a5540",
  Blue: "#2f5d9e",
  Green: "#2f6b4f",
  Yellow: "#e3c04a",
  Purple: "#6b4a7a",
};

// Abu netral untuk nama warna yang belum terdaftar.
//
// Sengaja BUKAN `color.toLowerCase()` seperti sebelumnya: nama yang bukan
// warna CSS menghasilkan nilai tidak sah, browser mengabaikannya, dan
// swatch-nya jadi putih — persis seperti warna yang benar-benar putih.
// Salah diam-diam lebih buruk daripada jelas-jelas tak dikenal, dan namanya
// tetap terbaca lewat atribut title.
const UNKNOWN_COLOR = "#c9c6c1";

export function OrderSheet({
  product,
  isOpen,
  onOpenChange,
  onAdded,
}: OrderSheetProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Pilihan disetel ulang setiap kali lembar ini dibuka untuk produk BERBEDA.
  //
  // Versi sebelumnya hanya mengisi saat pilihannya masih kosong, dan hanya
  // mengosongkannya setelah pesanan berhasil dibuat. Jadi: buka lembar untuk
  // produk A, pilih ukuran S, batalkan, lalu buka produk B — "S" masih
  // terpilih. Kalau B tidak menyediakan S, pesanan tercatat dengan ukuran yang
  // tidak ada.
  //
  // Sangat mudah terjadi di 一目惚れ, tempat orang membuka beberapa produk
  // berturut-turut dari grid yang sama.
  const [initializedFor, setInitializedFor] = useState<number | null>(null);

  if (product && isOpen && initializedFor !== product.id) {
    setInitializedFor(product.id);
    setSelectedSize(product.sizes[0] ?? "");
    setSelectedColor(product.colors[0] ?? "");
    // Panduan ukuran ikut ditutup. Ukurannya milik produk tertentu — kalau
    // panelnya tetap terbuka saat produk berganti, angka yang terpampang
    // sesaat masih milik barang sebelumnya.
    setShowSizeGuide(false);
  }

  const handleConfirm = () => {
    if (!product) return;
    if (!selectedSize && product.sizes.length > 0) {
      toast({ title: "サイズを選択してください", variant: "destructive" });
      return;
    }
    if (!selectedColor && product.colors.length > 0) {
      toast({ title: "カラーを選択してください", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        productId: product.id,
        selectedSize: selectedSize || "N/A",
        selectedColor: selectedColor || "N/A",
        quantity: 1,
      });

      if (!result.ok) {
        toast({
          title: "バッグに追加できませんでした",
          description: "時間をおいて、もう一度お試しください。",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "バッグに追加しました",
        // Dulu berbunyi `${product.name} is waiting for you.` — satu-satunya
        // kalimat berbahasa Inggris di antarmuka yang seluruhnya Jepang.
        // Disamakan dengan toast 一目惚れ: nama produknya saja.
        description: product.name,
        // Menyalakan bilah waktu di toast. Tanpa durasi eksplisit, Radix
        // memakai bawaannya dan komponen toast tidak punya angka untuk
        // digambar — jadi bilahnya tidak pernah muncul.
        //
        // 3 detik, sedikit lebih lama dari toast 一目惚れ yang 2,5 detik:
        // yang ini menandai barang MASUK KERANJANG, langkah terakhir sebelum
        // membayar, dan layak ditatap sesaat lebih lama.
        duration: 3000,
      });
      onOpenChange(false);
      onAdded?.();
      // Menandai belum terinisialisasi, bukan mengosongkan pilihannya —
      // pengisian ulang dilakukan saat lembar dibuka lagi, dan itu berlaku
      // untuk produk yang sama maupun berbeda. Tanpa timer, jadi tidak ada
      // jeda 300ms yang bisa dikalahkan oleh ketukan cepat.
      setInitializedFor(null);
    });
  };

  if (!product) return null;

  // Dihitung SESUDAH penjaga null di atas, jadi product sudah pasti ada.
  //
  // Tabelnya hanya berisi ukuran yang benar-benar dijual produk ini, jadi
  // bisa saja kosong — misalnya kalau admin mengisi ukuran dengan penamaan
  // bebas seperti "36" atau "FREE". Dalam kasus itu tombolnya disembunyikan
  // daripada membuka panel kosong.
  const sizeRows = sizeChartFor(product.gender, product.sizes);
  const hasSizeGuide = sizeRows.length > 0;

  // Bawahan diukur dari pinggang, atasan dari dada. Menampilkan 胸囲 pada
  // celana akan meminta angka yang tidak ada hubungannya dengan muat-tidaknya.
  const isBottom = product.category === "bottoms";

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-card-border rounded-t-3xl text-card-foreground">
        <DrawerHeader className="text-left pt-6 pb-2">
          <div className="flex gap-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-24 object-cover rounded-md"
            />
            <div className="flex flex-col justify-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {product.brand}
              </p>
              <DrawerTitle className="text-xl mb-1">{product.name}</DrawerTitle>
              <p className="font-serif text-lg">{formatPrice(product.price)}</p>
            </div>
          </div>
          <DrawerDescription className="sr-only">
            Select size and color for {product.name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {product.sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  サイズを選択
                </h4>
                {/* Tombol ini dulu TIDAK punya onClick sama sekali — bisa
                    diketuk tapi tidak melakukan apa pun.

                    Isinya diambil dari `dimensions` milik produk, tabel
                    採寸 yang sama dengan blok 基本情報 di kartu feed. Datanya
                    sudah ada; yang kurang cuma memunculkannya di tempat
                    keputusan ukuran benar-benar diambil.

                    Disembunyikan kalau produknya belum punya ukuran —
                    tombol panduan yang membuka panel kosong lebih buruk
                    daripada tidak ada tombol. */}
                {hasSizeGuide && (
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide((v) => !v)}
                    aria-expanded={showSizeGuide}
                    data-testid="button-size-guide"
                    className="inline-flex items-center gap-1 text-xs underline text-muted-foreground hover:text-foreground transition-colors"
                  >
                    サイズガイド
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 transition-transform",
                        showSizeGuide && "rotate-180",
                      )}
                    />
                  </button>
                )}
              </div>

              {showSizeGuide && (
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <p className="text-[11px] text-muted-foreground mb-2">
                    あなたの身体のサイズ（cm）から選べます。
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-muted-foreground">
                        <th className="text-left font-medium pb-1.5">サイズ</th>
                        <th className="text-right font-medium pb-1.5">身長</th>
                        <th className="text-right font-medium pb-1.5">
                          {isBottom ? "ウエスト" : "胸囲"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeRows.map((row) => (
                        <tr
                          key={row.size}
                          className={cn(
                            "border-t border-border/60",
                            // Baris ukuran yang sedang dipilih ditebalkan.
                            // Tanpa ini orang harus mencocokkan sendiri antara
                            // tombol di atas dan baris di tabel.
                            row.size === selectedSize && "font-bold text-primary",
                          )}
                        >
                          <td className="py-1.5">{row.size}</td>
                          <td className="py-1.5 text-right tabular-nums">
                            {row.height}
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {isBottom ? row.waist : row.chest}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    服そのものの実寸は、商品ページの「基本情報」にあります。
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-12 h-12 rounded-full border border-border flex items-center justify-center text-sm font-medium transition-all",
                      selectedSize === size
                        ? "bg-foreground text-background border-foreground scale-110"
                        : "hover:border-foreground/50",
                    )}
                    data-testid={`size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                カラーを選択
              </h4>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  const hex = colorMap[color] ?? UNKNOWN_COLOR;

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "group relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        selectedColor === color
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                          : "",
                      )}
                      title={color}
                      data-testid={`color-${color}`}
                    >
                      <span
                        className="w-full h-full rounded-full border border-border"
                        style={{ backgroundColor: hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-2 pb-8">
          <Button
            className="w-full h-14 rounded-full text-lg font-medium"
            onClick={handleConfirm}
            disabled={isPending}
            data-testid="button-confirm-add"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Add to Bag"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
