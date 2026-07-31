import type { Metadata } from "next";
import {
  DM_Sans,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Playfair_Display,
} from "next/font/google";

import { Toaster } from "@/components/ui/toaster";
import { Splash } from "@/components/splash";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Playfair dan DM Sans tidak punya glif kana maupun kanji sama sekali. Tanpa
// pasangan Jepang di bawah, setiap karakter Jepang jatuh ke font bawaan sistem
// dan tampil berbeda-beda di tiap perangkat.
//
// Keduanya dipasang sebagai FALLBACK di globals.css, bukan pengganti: huruf
// Latin (logo, angka harga, nama brand) tetap dirender Playfair/DM Sans, dan
// hanya karakter Jepang yang jatuh ke Noto. Itu sebabnya karakter tipografi
// aslinya tetap terjaga.
//
// preload: false wajib — subset Jepang berukuran sangat besar dan next/font
// menolak mem-preload-nya. Font tetap dimuat, hanya tidak di-preload.
const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  preload: false,
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "SwipeFash｜スワイプで出会う、次の一着",
  description:
    "選ぶのではなく、感じる。スワイプするだけで、あなたの好みに近づいていくファッションストア。",
  openGraph: {
    title: "SwipeFash｜スワイプで出会う、次の一着",
    description:
      "選ぶのではなく、感じる。スワイプするだけで、あなたの好みに近づいていくファッションストア。",
    type: "website",
    locale: "ja_JP",
  },
  icons: {
    icon: "/favicon.svg",
    // iOS TIDAK membaca manifest untuk ikon home screen — ia hanya mencari
    // tag ini. Tanpa apple-touch-icon, iPhone memakai screenshot halaman
    // sebagai ikon, dan hasilnya selalu jelek.
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    // Setara display:standalone untuk iOS, yang juga tidak membaca manifest
    // untuk hal ini.
    capable: true,
    title: "SwipeFash",
    // "default" menjaga teks bilah status tetap gelap di atas latar pink.
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Mewarnai bilah status ponsel dengan coral aplikasi saat dipasang.
  themeColor: "#fe6970",
  // Wajib supaya env(safe-area-inset-*) bernilai > 0 di perangkat berponi
  // (iPhone dsb). Tanpa ini util pb-safe/pt-safe di bawah tak berefek.
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${playfair.variable} ${dmSans.variable} ${notoSerifJP.variable} ${notoSansJP.variable}`}
    >
      <body>
        {/* Sebelum {children}: overlay ini harus sudah ada di HTML pertama yang
            dikirim server, bukan disisipkan belakangan oleh JavaScript. */}
        <Splash />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
