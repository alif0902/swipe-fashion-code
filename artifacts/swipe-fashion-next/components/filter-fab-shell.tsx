"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * Mekanika tombol 絞り込む yang mengambang — TANPA tahu apa isi lacinya.
 *
 * Dipisah dari isinya karena dua halaman memakainya dengan isi yang berbeda:
 * 探す menyaring dengan 並び替え dan 在庫 lewat query string, feed menyaring
 * dengan 性別 dan カテゴリー lewat cookie. Yang sama persis di keduanya justru
 * bagian yang paling merepotkan: batas geser, penjaga klik sesudah geser,
 * lencana jumlah filter, dan laci yang menampungnya.
 *
 * Alternatif yang ditolak: satu komponen dengan prop `mode`. Percabangan di
 * dalamnya akan tumbuh setiap kali salah satu halaman berubah, dan dua
 * halaman yang tidak berhubungan jadi saling mengunci.
 *
 * Dirender lewat prop `overlay` milik AppLayout, BUKAN dari dalam halaman.
 * `main` adalah wadah gulir yang juga `relative`, jadi `absolute` di dalamnya
 * berpatokan pada seluruh tinggi isi: tombolnya mendarat di dasar daftar dan
 * baru terlihat setelah digulir habis.
 */
export function FilterFabShell({
  activeCount,
  title,
  positionClassName = "bottom-[var(--nav-clearance)] right-5",
  children,
}: {
  activeCount: number;
  title: string;
  /**
   * Posisi awal tombol. Feed memakai nilai yang lebih tinggi karena dasar
   * layarnya sudah dihuni tombol いいね！.
   */
  positionClassName?: string;
  /** Isi laci. Menerima `close` supaya tombol di dalamnya bisa menutupnya. */
  children: (close: () => void) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const boundsRef = useRef<HTMLDivElement>(null);
  // useRef, bukan useState: nilainya dibaca di dalam handler click yang
  // berjalan sesaat setelah drag selesai. State akan memicu render ulang dan
  // nilai barunya belum tentu terbaca tepat waktu di gilirannya.
  const wasDragged = useRef(false);

  return (
    <>
      {/* Wadah pembatas geser.
          inset-0 pointer-events-none: ia menutupi seluruh bingkai ponsel hanya
          untuk dijadikan patokan batas, tanpa pernah menangkap sentuhan —
          isi di belakangnya tetap bisa digulir, diketuk, dan di-swipe.
          Tanpa wadah bersukuran nyata, dragConstraints tidak punya acuan dan
          tombolnya akan bisa diseret keluar layar sampai hilang. */}
      <div
        ref={boundsRef}
        className="absolute inset-0 z-30 pointer-events-none"
        aria-hidden="true"
      >
        <motion.button
          type="button"
          drag
          dragConstraints={boundsRef}
          // Tanpa momentum: tombol berhenti persis di tempat jari diangkat.
          // Inersia cocok untuk daftar yang digulir, bukan untuk benda yang
          // sedang diletakkan seseorang di posisi tertentu.
          dragMomentum={false}
          // Sedikit elastis di tepi supaya terasa hidup saat membentur batas,
          // tapi kecil — kalau terlalu besar ia terasa lepas kendali.
          dragElastic={0.08}
          whileDrag={{ scale: 1.06 }}
          onDragStart={() => {
            wasDragged.current = true;
          }}
          onClick={() => {
            // Menyeret lalu melepas juga memicu click di sebagian browser.
            // Tanpa penjaga ini, memindahkan tombol akan sekaligus membuka
            // panel filter — dan itu terasa seperti salah tekan.
            if (wasDragged.current) {
              wasDragged.current = false;
              return;
            }
            setIsOpen(true);
          }}
          data-testid="button-filter"
          aria-label={title}
          className={cn(
            "pointer-events-auto absolute h-14 pl-4 pr-5 rounded-full bg-foreground text-background shadow-xl flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none",
            positionClassName,
          )}
        >
          <span className="relative">
            <SlidersHorizontal className="w-5 h-5" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-sm font-bold">{title}</span>
        </motion.button>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-sans font-bold text-xl tracking-normal text-left">
              {title}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-6">
            {children(() => setIsOpen(false))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
