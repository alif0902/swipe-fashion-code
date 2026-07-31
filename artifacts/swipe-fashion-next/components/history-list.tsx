import Image from "next/image";
import Link from "next/link";
import { Star, ThumbsDown, ThumbsUp } from "lucide-react";

import { formatPrice } from "@/lib/format";
import type { SwipeHistoryEntry } from "@/lib/data";

// Label arah swipe. Dipakai 足あと; di いいね！履歴 lencana "pass" tidak pernah
// muncul karena datanya sudah disaring lebih dulu.
const directionBadge = {
  super: {
    label: "一目惚れ",
    icon: Star,
    className: "bg-violet-500/10 text-violet-500",
  },
  // Arah `like` sekarang berarti "digeser ke kanan", yaitu memulai pembelian —
  // bukan lagi menekan tombol いいね. Labelnya menyesuaikan supaya lencana ini
  // tidak menyebut aksi yang sudah berpindah arti.
  like: {
    label: "気になる",
    icon: ThumbsUp,
    className: "bg-primary/10 text-primary",
  },
  pass: {
    label: "見送り",
    icon: ThumbsDown,
    className: "bg-muted text-muted-foreground",
  },
} as const;

/**
 * Daftar bersama untuk 足あと dan いいね！履歴.
 *
 * Baris mendatar dengan foto kecil, bukan kartu besar seperti feed: ini
 * riwayat, dan yang dicari orang di sini adalah "yang mana tadi ya" — bukan
 * pengalaman menimbang satu per satu. Foto 64px sudah cukup untuk dikenali.
 */
export function HistoryList({
  entries,
  showDirection = true,
}: {
  entries: SwipeHistoryEntry[];
  showDirection?: boolean;
}) {
  return (
    <ul className="px-4 pb-8 space-y-2.5">
      {entries.map((entry) => {
        const badge = directionBadge[entry.direction];
        const Icon = badge.icon;

        return (
          <li key={`${entry.product.id}-${entry.decidedAt.getTime()}`}>
            <Link
              href={`/product/${entry.product.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
            >
              <div className="relative w-16 h-20 shrink-0 rounded-xl overflow-hidden bg-muted">
                <Image
                  src={entry.product.imageUrl}
                  alt={entry.product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground tracking-[0.12em] truncate">
                  {entry.product.brand}
                </p>
                <p className="font-sans font-bold text-sm leading-snug truncate mt-0.5">
                  {entry.product.name}
                </p>
                <p className="font-sans font-bold text-base text-primary mt-1">
                  {formatPrice(entry.product.price)}
                </p>
              </div>

              {showDirection && (
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                >
                  <Icon className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HistoryEmpty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Star;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-20 px-8">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-muted-foreground" />
      </div>
      <h2 className="font-sans font-bold text-xl mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-[260px]">{body}</p>
      <Link
        href="/feed"
        className="mt-6 h-12 px-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-sm font-bold"
      >
        スワイプを始める
      </Link>
    </div>
  );
}
