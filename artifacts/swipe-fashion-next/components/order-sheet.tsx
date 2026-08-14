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
  onAdded?: () => void;
}

const colorMap: Record<string, string> = {
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

  White: "#f4f2ee",
  Beige: "#e8dfd0",
  Brown: "#7a5540",
  Blue: "#2f5d9e",
  Green: "#2f6b4f",
  Yellow: "#e3c04a",
  Purple: "#6b4a7a",
};

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

  const [initializedFor, setInitializedFor] = useState<number | null>(null);

  if (product && isOpen && initializedFor !== product.id) {
    setInitializedFor(product.id);
    setSelectedSize(product.sizes[0] ?? "");
    setSelectedColor(product.colors[0] ?? "");
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
        description: product.name,
        duration: 3000,
      });
      onOpenChange(false);
      onAdded?.();
      setInitializedFor(null);
    });
  };

  if (!product) return null;

  const sizeRows = sizeChartFor(product.gender, product.sizes);
  const hasSizeGuide = sizeRows.length > 0;

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
