import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { listObsessed } from "@/lib/data";
import { getSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Obsessed | SwipeFash",
  description: "The pieces you super liked.",
};

export default async function ObsessedPage() {
  const sessionId = await getSessionId();
  const products = await listObsessed(sessionId);

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Super liked
            </span>
          </div>
          <h1 className="font-serif text-4xl">Obsessed</h1>
          <p className="text-muted-foreground mt-1 max-w-sm">
            The pieces you couldn&apos;t scroll past. Your feed is tuned toward
            these.
          </p>
        </header>

        <div className="px-4 pb-8 pt-2">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-muted">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 448px) 50vw, 224px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    {product.brand}
                  </p>
                  <h3 className="font-medium text-sm mb-1 leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="font-serif text-sm">
                    ${product.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-20 px-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                <Star className="w-9 h-9 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-2xl mb-2">
                Nothing you&apos;re obsessed with yet.
              </h2>
              <p className="text-muted-foreground max-w-[260px] mb-6">
                Swipe up — or tap the star — on a piece you love to super like
                it. It lands here and shapes your feed.
              </p>
              <Link
                href="/feed"
                className="h-12 px-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center uppercase text-sm tracking-widest font-medium hover:scale-[1.03] transition-transform"
              >
                Start swiping
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
