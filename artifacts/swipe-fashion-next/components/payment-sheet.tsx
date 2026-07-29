"use client";

import { useState, useTransition } from "react";
import {
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  ShieldCheck,
  Store,
  Truck,
  Wallet,
} from "lucide-react";

import { confirmOrderAction } from "@/app/actions";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/format";
import {
  DEMO_CARDS,
  PAYMENT_METHODS,
  cardBrandLabel,
  cvcLength,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  konbiniNumber,
  paymentLabel,
  validateCard,
  type CardErrors,
  type PaymentMethodId,
} from "@/lib/payment";

const METHOD_ICON: Record<PaymentMethodId, React.ElementType> = {
  card: CreditCard,
  paypay: QrCode,
  konbini: Store,
  applepay: Wallet,
  cod: Truck,
};

type Step = "method" | "detail" | "shipping" | "processing" | "done";

/**
 * Alur pembayaran demo.
 *
 * Sengaja dibuat berlangkah seperti checkout sungguhan — pilih metode, isi
 * detail, isi pengiriman, proses, selesai — karena satu formulir panjang tidak
 * mencerminkan bagaimana pembayaran benar-benar terasa di ponsel.
 *
 * Tidak ada uang yang berpindah dan tidak ada penyedia pembayaran yang
 * dihubungi. Nomor kartu hidup di state komponen ini saja dan hilang begitu
 * lembarnya ditutup; yang dikirim ke server hanyalah label seperti
 * "クレジットカード（Visa •••• 4242）".
 */
export function PaymentSheet({
  orderId,
  amount,
  isOpen,
  onOpenChange,
}: {
  orderId: number;
  amount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
    holder: "",
  });
  const [errors, setErrors] = useState<CardErrors>({});
  const [shipping, setShipping] = useState({
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
  });

  const brand = detectCardBrand(card.number);

  const reset = () => {
    setStep("method");
    setMethod(null);
    // Nomor kartu dibuang begitu lembar ditutup — tidak ada alasan menyimpannya.
    setCard({ number: "", expiry: "", cvc: "", holder: "" });
    setErrors({});
  };

  const close = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const chooseMethod = (id: PaymentMethodId) => {
    setMethod(id);
    const m = PAYMENT_METHODS.find((x) => x.id === id);
    setStep(m?.needsDetail ? "detail" : "shipping");
  };

  const submitCard = () => {
    const found = validateCard(card);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep("shipping");
  };

  const canSubmitShipping =
    shipping.customerName.trim() !== "" &&
    shipping.customerEmail.trim() !== "" &&
    shipping.shippingAddress.trim() !== "";

  const pay = () => {
    setStep("processing");
    startTransition(async () => {
      // Jeda buatan supaya tahap "memproses" terlihat. Tanpa ini peralihannya
      // instan dan justru terasa seolah tidak terjadi apa-apa.
      await new Promise((r) => setTimeout(r, 1600));

      const result = await confirmOrderAction(orderId, {
        paymentMethod: paymentLabel(method!, card.number),
        ...shipping,
      });

      if (!result.ok) {
        setStep("shipping");
        toast({
          title: "お支払いを完了できませんでした",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setStep("done");
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={close}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-2">
            {step !== "method" && step !== "processing" && step !== "done" && (
              <button
                type="button"
                aria-label="戻る"
                onClick={() => setStep(step === "shipping" ? "detail" : "method")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <DrawerTitle className="font-sans font-bold text-xl tracking-normal">
              お支払い
            </DrawerTitle>
            <span className="ml-auto font-sans font-bold text-lg text-primary tabular-nums">
              {formatPrice(amount)}
            </span>
          </div>

          {/* Spanduk demo sengaja menetap di semua langkah. Antarmuka
              pembayaran yang meyakinkan justru wajib menyatakan dirinya
              simulasi — jangan sampai ada yang memasukkan kartu asli. */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-left">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-900">
              これはデモです。実際の決済は行われず、カード番号は保存されません。
            </p>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          {step === "method" && (
            <div className="space-y-2.5 pt-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_ICON[m.id];
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => chooseMethod(m.id)}
                    data-testid={`payment-method-${m.id}`}
                    className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{m.label}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {m.caption}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === "detail" && method === "card" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="card-number">カード番号</Label>
                <div className="relative">
                  <Input
                    id="card-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    value={card.number}
                    onChange={(e) =>
                      setCard({ ...card, number: formatCardNumber(e.target.value) })
                    }
                    className="pr-16 tabular-nums"
                  />
                  {brand !== "unknown" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wider text-muted-foreground">
                      {cardBrandLabel(brand)}
                    </span>
                  )}
                </div>
                {errors.number && (
                  <p className="text-xs text-destructive">{errors.number}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="card-expiry">有効期限</Label>
                  <Input
                    id="card-expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) =>
                      setCard({ ...card, expiry: formatExpiry(e.target.value) })
                    }
                    className="tabular-nums"
                  />
                  {errors.expiry && (
                    <p className="text-xs text-destructive">{errors.expiry}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-cvc">セキュリティコード</Label>
                  <Input
                    id="card-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder={"•".repeat(cvcLength(brand))}
                    value={card.cvc}
                    maxLength={cvcLength(brand)}
                    onChange={(e) =>
                      setCard({
                        ...card,
                        cvc: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="tabular-nums"
                  />
                  {errors.cvc && (
                    <p className="text-xs text-destructive">{errors.cvc}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="card-holder">カード名義</Label>
                <Input
                  id="card-holder"
                  autoComplete="cc-name"
                  placeholder="TARO YAMADA"
                  value={card.holder}
                  onChange={(e) =>
                    setCard({ ...card, holder: e.target.value.toUpperCase() })
                  }
                />
                {errors.holder && (
                  <p className="text-xs text-destructive">{errors.holder}</p>
                )}
              </div>

              {/* Nomor uji ditampilkan agar penguji tidak perlu — dan tidak
                  tergoda — memakai kartu sungguhan. */}
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[11px] font-medium mb-1.5">テスト用カード番号</p>
                <div className="space-y-1">
                  {DEMO_CARDS.map((c) => (
                    <button
                      key={c.brand}
                      type="button"
                      onClick={() => setCard({ ...card, number: c.number })}
                      className="w-full flex justify-between text-[11px] text-muted-foreground hover:text-foreground tabular-nums"
                    >
                      <span>{c.brand}</span>
                      <span>{c.number}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full h-12 rounded-full" onClick={submitCard}>
                次へ
              </Button>
            </div>
          )}

          {step === "detail" && method === "paypay" && (
            <div className="pt-4 flex flex-col items-center text-center">
              <div className="w-52 h-52 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
                <QrCode className="w-32 h-32 text-foreground/80" strokeWidth={1} />
              </div>
              <p className="text-sm text-muted-foreground max-w-[260px] mb-6">
                PayPay アプリでこの QR コードを読み取ってください。デモのため、下のボタンで読み取り完了として進みます。
              </p>
              <Button
                className="w-full h-12 rounded-full"
                onClick={() => setStep("shipping")}
              >
                読み取り完了
              </Button>
            </div>
          )}

          {step === "detail" && method === "konbini" && (
            <div className="pt-2 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">お支払い番号</p>
                <p className="font-sans font-bold text-2xl tabular-nums tracking-wider">
                  {konbiniNumber(orderId)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  レジでこの番号をお伝えください。お支払い期限は 3 日以内です。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["ローソン", "ファミマ", "セブン"].map((s) => (
                  <div
                    key={s}
                    className="rounded-xl border border-border bg-card py-3 text-center text-xs"
                  >
                    {s}
                  </div>
                ))}
              </div>
              <Button
                className="w-full h-12 rounded-full"
                onClick={() => setStep("shipping")}
              >
                次へ
              </Button>
            </div>
          )}

          {step === "shipping" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="ship-name">お名前</Label>
                <Input
                  id="ship-name"
                  autoComplete="name"
                  value={shipping.customerName}
                  onChange={(e) =>
                    setShipping({ ...shipping, customerName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ship-email">メールアドレス</Label>
                <Input
                  id="ship-email"
                  type="email"
                  autoComplete="email"
                  value={shipping.customerEmail}
                  onChange={(e) =>
                    setShipping({ ...shipping, customerEmail: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ship-address">お届け先住所</Label>
                <Input
                  id="ship-address"
                  autoComplete="street-address"
                  value={shipping.shippingAddress}
                  onChange={(e) =>
                    setShipping({ ...shipping, shippingAddress: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                <span className="text-xs text-muted-foreground">お支払い方法</span>
                <span className="text-xs font-medium">
                  {method ? paymentLabel(method, card.number) : "—"}
                </span>
              </div>

              <Button
                className="w-full h-14 rounded-full text-base font-bold"
                onClick={pay}
                disabled={!canSubmitShipping || isPending}
                data-testid="button-pay"
              >
                <Lock className="w-4 h-4 mr-2" />
                {formatPrice(amount)} を支払う
              </Button>
            </div>
          )}

          {step === "processing" && (
            <div className="py-16 flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-5" />
              <p className="font-medium mb-1">お支払いを処理しています</p>
              <p className="text-xs text-muted-foreground">
                画面を閉じずにお待ちください
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
                <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
              </div>
              <p className="font-sans font-bold text-2xl mb-2">
                お支払いが完了しました
              </p>
              <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
                {method ? paymentLabel(method, card.number) : ""} で{" "}
                {formatPrice(amount)} のお支払いを承りました。
              </p>
              <Button
                className="w-full h-12 rounded-full"
                onClick={() => close(false)}
              >
                閉じる
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
