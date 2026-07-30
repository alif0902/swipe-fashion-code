"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { AuthSheet } from "@/components/auth-sheet";
import { Button } from "@/components/ui/button";

/**
 * Ajakan mendaftar yang muncul di Style DNA, bukan di feed.
 *
 * Feed sengaja dibiarkan bersih: kartunya memenuhi layar dan banner apa pun di
 * sana akan menutupi foto atau tombol aksi — mengganggu justru pada interaksi
 * inti aplikasi. Style DNA adalah tempat yang lebih tepat karena di sanalah
 * hasil belajarnya terlihat, sehingga "simpan ini" punya arti konkret.
 *
 * Hanya ditampilkan setelah ada cukup swipe. Menawarkan menyimpan sesuatu yang
 * belum terbentuk terasa seperti permintaan mendaftar biasa.
 */
export function SaveTastePrompt({ swipeCount }: { swipeCount: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 mb-4">
        <div className="flex items-start gap-3.5">
          <span className="w-11 h-11 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold mb-1">この結果を保存しますか？</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              いまの学習結果は、この端末のブラウザにだけ残っています。アカウントを作ると、他の端末でも同じ結果が続きます。
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          data-testid="button-save-taste"
          className="w-full h-11 rounded-full font-bold mt-4"
        >
          アカウントを作成
        </Button>
      </div>

      <AuthSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        reason={`これまでの${swipeCount}回のスワイプは、登録後もそのまま引き継がれます。`}
      />
    </>
  );
}
