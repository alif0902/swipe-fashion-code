import type { Metadata } from "next";
import {
  DM_Sans,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Playfair_Display,
} from "next/font/google";

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
  title: "HITOME｜スワイプで出会う、次の一着",
  description:
    "選ぶのではなく、感じる。スワイプするだけで、あなたの好みに近づいていくファッションストア。",
  openGraph: {
    title: "HITOME｜スワイプで出会う、次の一着",
    description:
      "選ぶのではなく、感じる。スワイプするだけで、あなたの好みに近づいていくファッションストア。",
    type: "website",
    locale: "ja_JP",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "HITOME",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fe6970",
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
        <Splash />
        {children}
      </body>
    </html>
  );
}
