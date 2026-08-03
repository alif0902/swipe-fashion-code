import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "管理画面｜SwipeFash",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Kerangka area admin.
 *
 * Sengaja TIDAK memakai AppLayout. Aplikasinya mobile-only karena interaksi
 * intinya adalah swipe — gestur sentuh. Panel admin bukan produk, melainkan
 * alat kerja: formulir produk punya tiga belas kolom dan pratinjaunya duduk
 * di sebelahnya. Itu hanya masuk akal di layar lebar.
 *
 * Persis seperti Shopify: tokonya untuk ponsel, adminnya untuk laptop.
 *
 * requireAdmin() di sini menahan orang membuka halamannya. Ia TIDAK menjaga
 * Server Action — layout tidak pernah berjalan saat aksi dipanggil langsung.
 * Karena itu setiap aksi di app/admin/actions.ts memanggilnya sendiri.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-[100dvh] bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/admin" className="font-sans font-bold text-lg shrink-0">
            SwipeFash <span className="text-primary">管理</span>
          </Link>

          <AdminNav />

          <div className="ml-auto flex items-center gap-4 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {admin.email}
            </span>
            <Link
              href="/feed"
              className="text-xs font-bold h-9 px-4 rounded-full bg-muted flex items-center"
            >
              ストアを見る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>

      {/* Panel admin adalah alat desktop biasa, jadi posisi bawaan pojok
          kanan bawah memang yang benar di sini. */}
      <Toaster />
    </div>
  );
}
