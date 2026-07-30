"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

import { updateAvatarAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const SIZE = 256;

/**
 * Mengecilkan foto di BROWSER sebelum dikirim.
 *
 * Foto dari kamera ponsel biasa berukuran 3–8 MB. Mengirimnya apa adanya ke
 * Server Action berarti unggahan lama di jaringan seluler, dan hasilnya tetap
 * dirender sebagai lingkaran 96px. Canvas memotongnya ke persegi di tengah
 * lalu menyimpannya sebagai JPEG 256px — sekitar 15–25 KB.
 *
 * Efek sampingnya menguntungkan privasi: menggambar ulang lewat canvas
 * membuang seluruh metadata EXIF, termasuk koordinat GPS yang menempel pada
 * foto ponsel.
 */
function shrinkToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }

      // Potong persegi dari tengah, bukan diperas jadi persegi — wajah yang
      // gepeng jauh lebih buruk daripada tepi yang terpotong.
      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;

      ctx.drawImage(image, sx, sy, side, side, 0, 0, SIZE, SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };

    image.src = url;
  });
}

export function AvatarUploader({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Direset lebih dulu supaya memilih berkas yang SAMA dua kali tetap
    // memicu onChange.
    event.target.value = "";
    if (!file) return;

    setIsBusy(true);
    try {
      const dataUrl = await shrinkToSquare(file);
      const result = await updateAvatarAction(dataUrl);

      if (!result.ok) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "プロフィール写真を更新しました" });
      router.refresh();
    } catch {
      toast({
        title: "画像を読み込めませんでした",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        data-testid="button-avatar"
        aria-label="プロフィール写真を変更"
        className="block rounded-full"
      >
        {children}
      </button>

      {/* Lencana kamera menempel di tepi lingkaran — tanpa ini tidak ada yang
          tahu fotonya bisa diketuk. */}
      <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary border-[3px] border-background flex items-center justify-center pointer-events-none">
        {isBusy ? (
          <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5 text-primary-foreground" />
        )}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
