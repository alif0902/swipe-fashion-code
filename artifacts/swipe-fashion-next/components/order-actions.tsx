"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { cancelOrderAction } from "@/app/actions";
import { AuthSheet } from "@/components/auth-sheet";
import {
  PaymentSheet,
  type ShippingDefaults,
} from "@/components/payment-sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { AppOrder } from "@/lib/format";

// Hanya id, status, dan jumlah yang dibutuhkan. Mengoper seluruh AppOrder akan
// ikut mengirim sessionId dan data pembeli ke bundel klien tanpa ada yang
// memakainya.
export function OrderActions({
  orderId,
  status,
  amount,
  isSignedIn,
  shippingDefaults,
}: {
  orderId: number;
  status: AppOrder["status"];
  amount: number;
  isSignedIn: boolean;
  shippingDefaults?: ShippingDefaults;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPaying, setIsPaying] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (status === "cancelled") return null;

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      toast(
        result.ok
          ? { title: "注文をキャンセルしました" }
          : {
              title: "注文をキャンセルできませんでした",
              description: result.error,
              variant: "destructive",
            },
      );
    });
  };

  // Pesanan yang sudah dibayar hanya menyisakan opsi pembatalan.
  if (status !== "pending") {
    return (
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={handleCancel}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "注文をキャンセル"
        )}
      </Button>
    );
  }

  // Formulir nama/email/alamat yang dulu ada di sini sudah pindah ke dalam
  // PaymentSheet — meminta alamat sebelum pembeli memilih cara membayar adalah
  // urutan yang terbalik dari checkout mana pun.
  // Satu-satunya tempat di aplikasi ini yang benar-benar memerlukan akun.
  // Pesanan butuh identitas yang bertahan lebih lama dari sebuah cookie:
  // pembeli harus bisa menemukan pesanannya lagi besok, dari perangkat lain.
  // Swipe, 一目惚れ, dan Style DNA sengaja tetap terbuka tanpa mendaftar.
  const startCheckout = () => {
    if (!isSignedIn) {
      setIsAuthOpen(true);
      return;
    }
    setIsPaying(true);
  };

  return (
    <>
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 rounded-full font-bold"
          onClick={startCheckout}
          data-testid="button-checkout"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          お支払いへ進む
        </Button>
        <Button
          variant="ghost"
          className="h-12 rounded-full px-5 text-muted-foreground"
          onClick={handleCancel}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "キャンセル"
          )}
        </Button>
      </div>

      <PaymentSheet
        orderId={orderId}
        amount={amount}
        isOpen={isPaying}
        onOpenChange={setIsPaying}
        shippingDefaults={shippingDefaults}
      />

      <AuthSheet
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        reason="ご注文の確認のため、アカウントが必要です。登録後、そのままお支払いに進めます。"
      />
    </>
  );
}
