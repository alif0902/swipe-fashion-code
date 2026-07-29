"use client";

import { GalleryVerticalEnd, Layers, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link
          href="/feed"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
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
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
            pathname === "/lookbook" && "text-foreground",
          )}
        >
          <GalleryVerticalEnd
            className="w-6 h-6"
            strokeWidth={pathname === "/lookbook" ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium tracking-wider">
            ルックブック
          </span>
        </Link>
        <Link
          href="/obsessed"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
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
            "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
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
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative overflow-hidden">
      <main className="flex-1 w-full max-w-md mx-auto relative pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
