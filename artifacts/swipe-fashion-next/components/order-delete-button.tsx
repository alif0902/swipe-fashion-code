"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteOrderAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export function OrderDeleteButton({ orderId }: { orderId: number }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const result = await deleteOrderAction(orderId);

      toast(
        result.ok
          ? { title: "履歴から削除しました" }
          : {
              title: "削除できませんでした",
              description: result.error,
              variant: "destructive",
            },
      );
    });
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isPending}
      data-testid={`button-delete-order-${orderId}`}
      aria-label="この注文を履歴から削除"
      title="履歴から削除"
      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/70 transition hover:bg-destructive/10 hover:text-destructive active:scale-95 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
