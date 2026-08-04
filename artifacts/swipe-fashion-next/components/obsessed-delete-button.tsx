"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { undoSuperLikeAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

/**
 * Membuang satu barang dari koleksi 一目惚れ.
 *
 * Dibuat sepadan dengan OrderDeleteButton di halaman バッグ — ikon, ukuran,
 * warna hover, keadaan memuat, dan ketiadaan dialog konfirmasi semuanya sama.
 * Dua daftar yang sama-sama bisa dirapikan sebaiknya dirapikan dengan cara
 * yang sama.
 *
 * TIDAK ada dialog konfirmasi, mengikuti alasan yang sama seperti di バッグ:
 * tindakan ini murah untuk dibatalkan — produknya kembali muncul di feed dan
 * bisa disimpan lagi dengan satu ketukan. Dialog untuk tindakan tanpa
 * konsekuensi melatih orang menekan「はい」tanpa membaca, dan itu merugikan di
 * tempat yang benar-benar berbahaya nanti.
 *
 * Kenapa berlatar putih padahal versi バッグ transparan: di sana tombolnya
 * duduk di atas kartu putih, di sini ia duduk di atas FOTO. Ikon abu di atas
 * foto bisa jatuh pada bagian terang mana pun dan hilang. Latar putihnya
 * disamakan dengan tombol バッグに入れる di kartu yang sama.
 */
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
