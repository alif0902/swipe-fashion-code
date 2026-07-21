import { Link, useLocation } from "wouter"
import { Layers, ShoppingBag, GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const [location] = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link href="/" className={cn(
          "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
          location === "/" && "text-foreground"
        )}>
          <Layers className="w-6 h-6" strokeWidth={location === "/" ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Feed</span>
        </Link>
        <Link href="/lookbook" className={cn(
          "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
          location === "/lookbook" && "text-foreground"
        )}>
          <GalleryVerticalEnd className="w-6 h-6" strokeWidth={location === "/lookbook" ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Lookbook</span>
        </Link>
        <Link href="/orders" className={cn(
          "flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors",
          location === "/orders" && "text-foreground"
        )}>
          <ShoppingBag className="w-6 h-6" strokeWidth={location === "/orders" ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Bag</span>
        </Link>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative overflow-hidden">
      <main className="flex-1 w-full max-w-md mx-auto relative pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
