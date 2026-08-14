"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { undoSuperLikeAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export function ObsessedDeleteButton({ productId }: { productId: number }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const result = await undoSuperLikeAction(productId);

      toast(
        result.ok
          ? { title: "一目惚れから削除しました" }
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
      data-testid={`button-delete-obsessed-${productId}`}
      aria-label="一目惚れから削除"
      title="一目惚れから削除"
      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center text-foreground/70 transition hover:scale-105 hover:text-destructive active:scale-95 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
