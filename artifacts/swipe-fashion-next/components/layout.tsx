"use client";

import {
  GalleryVerticalEnd,
  Layers,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { InstallPrompt } from "@/components/install-prompt";

export function BottomNav() {
  const pathname = usePathname();

  return (
    // `absolute`, BUKAN `fixed`. Fixed menempel ke viewport, dan di dalam
    // bingkai perangkat pada layar besar itu salah — bilahnya akan melayang
    // di dasar layar, lepas dari bingkainya. Absolute menempel ke bingkai,
    // jadi ia ikut ke mana pun bingkainya berada.
    //
    // Wadah luar `pointer-events-none` supaya celah transparan di kiri, kanan,
    // dan bawah pil tidak menghalangi sentuhan ke konten di baliknya. Hanya
    // pilnya sendiri yang menerima sentuhan.
    <div className="absolute bottom-0 inset-x-0 z-40 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pointer-events-none">
      {/*
        Efek kaca.
        - backdrop-blur-2xl mengaburkan apa pun yang lewat di belakangnya.
          Ini yang membuatnya terbaca sebagai kaca, bukan sekadar panel
          semitransparan — jadi konten memang harus mengalir di bawahnya,
          bukan berhenti di atasnya.
        - Latar putih 55% menahan agar teks tetap terbaca di atas foto gelap.
        - Dua garis: border putih terang di luar, dan inset shadow putih tipis
          di dalam. Pasangan itu yang meniru tepi kaca yang menangkap cahaya.
        - saturate-150 mengangkat warna yang terlihat menembus kaca; tanpa itu
          hasil blur cenderung kelabu dan mati.
      */}
      <div className="pointer-events-auto mx-auto max-w-sm rounded-[1.75rem] bg-white/55 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] flex justify-around items-center h-16 px-2">
        <Link
          href="/feed"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/feed" && "text-foreground",
          )}
        >
          <Layers className="w-6 h-6" strokeWidth={pathname === "/feed" ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium tracking-wider">
            フィード
          </span>
        </Link>
        <Link
          href="/lookbook"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/lookbook" && "text-foreground",
          )}
        >
          <GalleryVerticalEnd
            className="w-6 h-6"
            strokeWidth={pathname === "/lookbook" ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium tracking-wider">
            探す
          </span>
        </Link>
        <Link
          href="/obsessed"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/obsessed" && "text-foreground",
          )}
        >
          <Star
            className="w-6 h-6"
            strokeWidth={pathname === "/obsessed" ? 2.5 : 1.5}
            fill={pathname === "/obsessed" ? "currentColor" : "none"}
          />
          <span className="text-[10px] font-medium tracking-wider">
            一目惚れ
          </span>
        </Link>
        <Link
          href="/orders"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/orders" && "text-foreground",
          )}
        >
          <ShoppingBag
            className="w-6 h-6"
            strokeWidth={pathname === "/orders" ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium tracking-wider">
            バッグ
          </span>
        </Link>
        <Link
          href="/account"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/account" && "text-foreground",
          )}
        >
          <UserRound
            className="w-6 h-6"
            strokeWidth={pathname === "/account" ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium tracking-wider">
            マイページ
          </span>
        </Link>
      </div>
    </div>
  );
}

// Bingkai perangkat.
//
// Aplikasi ini dirancang untuk satu kolom sempit. Di layar laptop, kolom itu
// dulu terdampar di tengah halaman putih yang luas dan terlihat seperti
// halaman yang gagal dimuat. Membuatnya melebar penuh juga bukan jawaban:
// kartu swipe setinggi layar dengan lebar 1400px terlihat aneh, dan gestur
// swipe memang bukan interaksi desktop.
//
// Jadi di md ke atas, kolomnya dibungkus jadi bingkai bersudut membulat dengan
// bayangan di atas latar lembut — terbaca sebagai perangkat, bukan sebagai
// tata letak yang rusak. Di bawah md tidak ada bingkai sama sekali: aplikasi
// memenuhi layar seperti biasa.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background md:bg-gradient-to-br md:from-rose-100 md:via-purple-100 md:to-sky-100 md:p-6">
      <div className="relative w-full max-w-md h-[100dvh] md:h-[min(900px,94vh)] bg-background text-foreground flex flex-col overflow-hidden md:rounded-[2.25rem] md:border md:border-black/5 md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneFrame>
      {/* min-h-0 wajib: tanpa itu flex item menolak menyusut di bawah tinggi
          kontennya, dan halaman panjang tidak akan menggulir di dalam bingkai.

          Sejak bilah navigasi jadi pil mengambang (absolute), ia tidak lagi
          memakan ruang di kolom flex ini — jadi main memenuhi seluruh tinggi
          bingkai dan konten mengalir DI BAWAH kacanya. Itu memang syarat efek
          kacanya: backdrop-blur butuh sesuatu untuk dikaburkan.

          Konsekuensinya tiap halaman berdaftar perlu ruang bawah sendiri
          (pb-28) agar baris terakhirnya tidak tertutup pil. */}
      {/* overflow-x-hidden: menyetel overflow-y saja membuat overflow-x
          otomatis jadi `auto`, sehingga elemen apa pun yang sengaja menjorok
          keluar tepi (panah foto di kartu produk) mengubah seluruh layar jadi
          bisa digeser mendatar. */}
      <main className="flex-1 min-h-0 w-full relative overflow-y-auto overflow-x-hidden overscroll-none">
        {children}
      </main>
      {/* Di dalam bingkai, bukan di luar: ajakan harus menempel pada aplikasi,
          bukan melayang di latar desktop. */}
      <InstallPrompt />
      <BottomNav />
    </PhoneFrame>
  );
}
