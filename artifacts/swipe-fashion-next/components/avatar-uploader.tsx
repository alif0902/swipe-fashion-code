"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";

import { removeAvatarAction, updateAvatarAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const SIZE = 256;

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

export function AvatarUploader({
  children,
  hasImage = false,
}: {
  children: React.ReactNode;
  hasImage?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const onRemove = async () => {
    if (!confirm("プロフィール写真を削除しますか？")) return;

    setIsBusy(true);
    const result = await removeAvatarAction();
    setIsBusy(false);

    if (!result.ok) {
      toast({ title: result.error, variant: "destructive" });
      return;
    }

    toast({ title: "プロフィール写真を削除しました" });
    router.refresh();
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

      <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary border-[3px] border-background flex items-center justify-center pointer-events-none">
        {isBusy ? (
          <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5 text-primary-foreground" />
        )}
      </span>

      {hasImage && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isBusy}
          data-testid="button-avatar-remove"
          aria-label="プロフィール写真を削除"
          className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-background border-[3px] border-background shadow-sm flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
