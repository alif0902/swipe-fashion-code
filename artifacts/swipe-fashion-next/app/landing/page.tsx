import type { Metadata } from "next";

import type { AppProduct } from "@/lib/format";
import { listProducts } from "@/lib/data";

import { LandingClient } from "./landing-client";

// Showcase menarik produk terbaru; jangan di-cache statis saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SwipeFash — Swipe first. Regret never.",
  description:
    "The most addictive way to shop fashion. Swipe through curated drops, match with pieces you love, and cop them in two taps.",
  openGraph: {
    title: "SwipeFash — Swipe first. Regret never.",
    description:
      "Swipe through curated fashion. Match with the piece. Cop it in two taps.",
    type: "website",
  },
};

export default async function LandingPage() {
  // Landing harus tetap tampil walau DATABASE_URL belum diset — showcase
  // jatuh ke daftar kurasi bila query gagal atau kosong.
  let products: AppProduct[] = [];
  try {
    products = await listProducts({ limit: 8 });
  } catch {
    products = [];
  }

  return <LandingClient products={products} />;
}
