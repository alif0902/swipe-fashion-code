import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

import { Toaster } from "@/components/ui/toaster";

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

export const metadata: Metadata = {
  title: "SwipeFash - Fashion Swipe Store",
  description:
    "Swipe through curated fashion. Find the piece, order it in two taps.",
  openGraph: {
    title: "SwipeFash - Fashion Swipe Store",
    description:
      "Swipe through curated fashion. Find the piece, order it in two taps.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
