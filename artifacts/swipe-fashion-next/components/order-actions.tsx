"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { cancelOrderAction, confirmOrderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AppOrder } from "@/lib/format";

export function OrderActions({ order }: { order: AppOrder }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [form, setForm] = useState({
    paymentMethod: "Card",
    shippingAddress: "",
    customerName: "",
    customerEmail: "",
  });

  if (order.status === "cancelled") return null;

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrderAction(order.id);
      toast(
        result.ok
          ? { title: "Order cancelled" }
          : {
              title: "Could not cancel order",
              description: result.error,
              variant: "destructive",
            },
      );
    });
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmOrderAction(order.id, form);
      if (!result.ok) {
        toast({
          title: "Could not confirm order",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Order confirmed" });
      setIsConfirming(false);
    });
  };

  if (order.status !== "pending") {
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
          "Cancel order"
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
        <Label htmlFor={`name-${order.id}`}>Name</Label>
        <Input
          id={`name-${order.id}`}
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`email-${order.id}`}>Email</Label>
        <Input
          id={`email-${order.id}`}
          type="email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`address-${order.id}`}>Shipping address</Label>
        <Input
          id={`address-${order.id}`}
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
          "Place order"
        )}
      </Button>
    </div>
  );
}
