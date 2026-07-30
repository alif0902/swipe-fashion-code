"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "ダッシュボード", exact: true },
  { href: "/admin/products", label: "商品", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        // /admin cocok dengan semua rute admin kalau dibandingkan dengan
        // startsWith, jadi tautan dashboard perlu perbandingan persis.
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "h-9 px-4 rounded-full text-sm font-bold flex items-center transition",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
