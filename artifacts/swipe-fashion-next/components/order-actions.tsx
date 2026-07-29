"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { cancelOrderAction, confirmOrderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AppOrder } from "@/lib/format";

// Hanya id dan status yang dibutuhkan. Mengoper seluruh AppOrder akan ikut
// mengirim sessionId dan data pembeli ke bundel klien tanpa ada yang memakainya.
export function OrderActions({
  orderId,
  status,
}: {
  orderId: number;
  status: AppOrder["status"];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [form, setForm] = useState({
    paymentMethod: "Card",
    shippingAddress: "",
    customerName: "",
    customerEmail: "",
  });

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

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmOrderAction(orderId, form);
      if (!result.ok) {
        toast({
          title: "注文を確定できませんでした",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "注文が確定しました" });
      setIsConfirming(false);
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

  if (!isConfirming) {
    return (
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 rounded-full"
          onClick={() => setIsConfirming(true)}
        >
          Confirm
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-12 rounded-full text-muted-foreground"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`name-${orderId}`}>お名前</Label>
        <Input
          id={`name-${orderId}`}
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`email-${orderId}`}>メールアドレス</Label>
        <Input
          id={`email-${orderId}`}
          type="email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`address-${orderId}`}>お届け先住所</Label>
        <Input
          id={`address-${orderId}`}
          value={form.shippingAddress}
          onChange={(e) =>
            setForm({ ...form, shippingAddress: e.target.value })
          }
        />
      </div>
      <Button
        className="w-full h-12 rounded-full"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "注文を確定する"
        )}
      </Button>
    </div>
  );
}
