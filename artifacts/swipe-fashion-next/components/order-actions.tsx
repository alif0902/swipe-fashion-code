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
