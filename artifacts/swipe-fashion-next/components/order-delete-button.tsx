"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteOrderAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

/**
 * Membuang pesanan yang sudah dibatalkan dari daftar バッグ.
 *
 * Tanpa ini, pesanan yang dibatalkan menumpuk selamanya di halaman バッグ dan
 * mendorong pesanan aktif makin ke bawah — daftar berubah jadi arsip yang
 * tidak bisa dirapikan.
 *
 * Hanya muncul pada baris berstatus キャンセル済み. Pesanan aktif tidak boleh
 * langsung dihapus: ia harus dibatalkan lebih dulu supaya stoknya kembali.
 *
 * Tidak ada dialog konfirmasi, dan itu disengaja — yang dihapus adalah baris
 * yang sudah dibatalkan, jadi tidak ada nilai yang hilang. Menambah dialog
 * untuk tindakan tanpa konsekuensi justru melatih orang menekan「はい」tanpa
 * membaca, dan itu merugikan di tempat yang benar-benar berbahaya nanti.
 */
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
