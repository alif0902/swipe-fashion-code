"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { cancelOrderAction } from "@/app/actions";
import { PaymentSheet } from "@/components/payment-sheet";
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
}: {
  orderId: number;
  status: AppOrder["status"];
  amount: number;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPaying, setIsPaying] = useState(false);

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
  return (
    <>
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 rounded-full font-bold"
          onClick={() => setIsPaying(true)}
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
      />
    </>
  );
}
