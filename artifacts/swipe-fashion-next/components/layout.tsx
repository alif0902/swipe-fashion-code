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
import { Toaster } from "@/components/ui/toaster";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 inset-x-0 z-40 px-4 pb-[var(--nav-bottom-gap)] pointer-events-none">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(var(--nav-clearance)+1rem)] backdrop-blur-xl"
        style={{
          maskImage: "linear-gradient(to top, black 60%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black 60%, transparent)",
        }}
      />

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

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background md:bg-gradient-to-br md:from-rose-100 md:via-purple-100 md:to-sky-100 md:p-6">
      <div className="relative w-full max-w-md h-[100dvh] md:h-[min(900px,94vh)] bg-background text-foreground flex flex-col overflow-hidden md:rounded-[2.25rem] md:border md:border-black/5 md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function AppLayout({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <PhoneFrame>
      <main className="flex-1 min-h-0 w-full relative overflow-y-auto overflow-x-hidden overscroll-none">
        {children}
      </main>

      {overlay}

      <Toaster viewportClassName="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] bottom-auto right-auto p-3 w-full max-w-none sm:max-w-none" />
      <InstallPrompt />
      <BottomNav />
    </PhoneFrame>
  );
}
