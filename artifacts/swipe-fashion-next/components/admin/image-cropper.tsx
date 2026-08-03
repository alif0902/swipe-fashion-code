"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Pemotong foto produk dengan bingkai potret tetap.
 *
 * KENAPA INI ADA. Sebelumnya berkas diunggah apa adanya, hanya dikecilkan ke
 * lebar 1080 dengan rasio asli dipertahankan. Kartu feed lalu merendernya
 * dengan `object-cover` pada bingkai potret — jadi foto lanskap dipotong dari
 * TENGAH secara otomatis, dan kepala model atau sepatunya hilang tanpa ada
 * yang bisa dilakukan admin.
 *
 * Sekarang pemotongannya diputuskan saat unggah, oleh orang yang melihat
 * fotonya. Yang tersimpan sudah berbentuk 3:4, jadi `object-cover` di kartu
 * tidak lagi memotong apa pun.
 *
 * Sengaja tanpa pustaka pihak ketiga. Yang dibutuhkan cuma geser dan zoom di
 * satu bingkai berukuran tetap — beberapa puluh baris canvas, dibanding satu
 * dependensi lagi yang harus ikut diperbarui selamanya.
 */

// 3:4 — rasio yang sama dengan bingkai foto di ProductCard.
const OUT_W = 1080;
const OUT_H = 1440;

// Ukuran bingkai pratinjau di layar. Rasionya harus sama dengan keluaran,
// kalau tidak apa yang dilihat bukan apa yang tersimpan.
const BOX_W = 270;
const BOX_H = 360;

export function ImageCropper({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  const dragging = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // FileReader, BUKAN URL.createObjectURL.
    //
    // Versi pertama memakai object URL dan salah di dua tempat sekaligus:
    //
    //   1. URL-nya di-revoke di dalam onload, padahal `img.src` yang sama
    //      dipakai untuk merender pratinjau — jadi <img> menunjuk alamat yang
    //      sudah mati.
    //   2. Cleanup effect juga me-revoke-nya. Di mode dev, StrictMode
    //      menjalankan effect dua kali (mount → unmount → mount), sehingga
    //      URL-nya batal SEBELUM gambarnya selesai dimuat dan onerror terpicu.
    //      Gejalanya: setiap foto, sekalipun formatnya benar, ditolak dengan
    //      "この画像は読み込めませんでした".
    //
    // Data URL tidak perlu dibatalkan dan tidak punya siklus hidup, jadi
    // seluruh kelas bug ini hilang. Fotonya toh sudah dibaca ke memori untuk
    // digambar ke canvas.
    let cancelled = false;
    const reader = new FileReader();

    reader.onload = () => {
      if (cancelled) return;

      const image = new window.Image();
      image.onload = () => {
        if (cancelled) return;
        setImg(image);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      image.onerror = () => {
        if (cancelled) return;
        setError(
          "この画像は読み込めませんでした。JPEG・PNG・WebP を選んでください。",
        );
      };
      image.src = reader.result as string;
    };

    reader.onerror = () => {
      if (cancelled) return;
      setError("ファイルを読み込めませんでした。");
    };

    reader.readAsDataURL(file);

    // Menandai batal, bukan membatalkan sumbernya — pemuatan yang sudah jalan
    // dibiarkan selesai tapi hasilnya diabaikan.
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Skala minimum supaya foto SELALU menutupi bingkai — tanpa ini, menggeser
  // terlalu jauh akan memunculkan pita kosong di tepi hasil potongan.
  const baseScale = img
    ? Math.max(BOX_W / img.naturalWidth, BOX_H / img.naturalHeight)
    : 1;
  const scale = baseScale * zoom;

  // Batas geser: setengah dari kelebihan ukuran di tiap sumbu.
  const clamp = (next: { x: number; y: number }) => {
    if (!img) return next;
    const maxX = Math.max(0, (img.naturalWidth * scale - BOX_W) / 2);
    const maxY = Math.max(0, (img.naturalHeight * scale - BOX_H) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setOffset(
      clamp({
        x: e.clientX - dragging.current.x,
        y: e.clientY - dragging.current.y,
      }),
    );
  };

  const onPointerUp = () => {
    dragging.current = null;
  };

  // Zoom diterapkan ke offset juga, supaya titik tengah bingkai tetap kira-kira
  // menunjuk bagian foto yang sama saat slider digeser.
  const changeZoom = (next: number) => {
    const ratio = next / zoom;
    setZoom(next);
    setOffset((prev) => clamp({ x: prev.x * ratio, y: prev.y * ratio }));
  };

  const confirm = () => {
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Latar putih: foto PNG transparan akan jadi hitam tanpa ini saat
    // dikodekan ulang ke JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT_W, OUT_H);

    // Pratinjau BOX_W lebar; keluaran OUT_W. Semua ukuran dikalikan rasio itu
    // supaya hasilnya identik dengan yang dilihat, hanya lebih besar.
    const k = OUT_W / BOX_W;
    const dw = img.naturalWidth * scale * k;
    const dh = img.naturalHeight * scale * k;
    const dx = (OUT_W - dw) / 2 + offset.x * k;
    const dy = (OUT_H - dh) / 2 + offset.y * k;

    ctx.drawImage(img, dx, dy, dw, dh);
    onDone(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-5 w-full max-w-sm">
        <h3 className="font-sans font-bold mb-1">写真の位置を調整</h3>
        <p className="text-xs text-muted-foreground mb-4">
          ドラッグで移動、スライダーで拡大。この枠がフィードに出る範囲です。
        </p>

        {error ? (
          <p className="text-sm text-destructive py-8 text-center">{error}</p>
        ) : (
          <>
            <div
              className="relative mx-auto overflow-hidden rounded-xl bg-muted touch-none cursor-grab active:cursor-grabbing"
              style={{ width: BOX_W, height: BOX_H }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: img.naturalWidth * scale,
                    height: img.naturalHeight * scale,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => changeZoom(Number(e.target.value))}
                disabled={!img}
                className="w-full accent-primary"
                aria-label="拡大"
              />
            </div>
          </>
        )}

        <div className="flex gap-2 mt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 rounded-full"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={!img || Boolean(error)}
            className="flex-1 rounded-full font-bold"
          >
            この範囲で追加
          </Button>
        </div>
      </div>
    </div>
  );
}
