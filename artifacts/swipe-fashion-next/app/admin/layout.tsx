import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "管理画面｜HITOME",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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
          <Link
            href="/admin"
            className="shrink-0 flex items-baseline gap-2 font-sans font-bold"
          >
            <span className="text-lg tracking-[0.2em]">HITOME</span>
            <span className="text-sm text-primary">管理</span>
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

      <Toaster />
    </div>
  );
}
